ALTER TABLE sales.fulfillment_assessment ADD COLUMN fulfillment_mode text NOT NULL DEFAULT 'STOCK' CHECK(fulfillment_mode IN ('STOCK','MAKE'));
ALTER TABLE sales.fulfillment_assessment DROP CONSTRAINT fulfillment_assessment_check;
ALTER TABLE sales.fulfillment_assessment ADD CONSTRAINT assessment_result CHECK(
 (state='DRAFT' AND fulfillment_mode='STOCK' AND selections IS NULL AND stock IS NULL AND observed_at IS NULL) OR
 (state='RECORDED' AND observed_at IS NOT NULL AND (
  (fulfillment_mode='MAKE' AND selections IS NULL AND stock IS NULL) OR
  (fulfillment_mode='STOCK' AND selections IS NOT NULL AND stock IS NOT NULL AND jsonb_typeof(selections)='array' AND jsonb_array_length(selections) BETWEEN 1 AND 8 AND jsonb_typeof(stock)='array' AND jsonb_array_length(stock) BETWEEN 1 AND 16 AND octet_length(selections::text)<=8192 AND octet_length(stock::text)<=8192)
 ))
);
CREATE OR REPLACE FUNCTION sales.assessment_transition() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.state<>'DRAFT' THEN RAISE EXCEPTION 'Invalid initial assessment state' USING ERRCODE='23514'; END IF;
 ELSE
  IF (to_jsonb(NEW)-ARRAY['state','fulfillment_mode','selections','stock','observed_at']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['state','fulfillment_mode','selections','stock','observed_at']) OR NOT (OLD.state='DRAFT' AND NEW.state='RECORDED') THEN
   RAISE EXCEPTION 'Immutable assessment or invalid transition' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NEW;
END;
$$;
ALTER TABLE sales.sales_order DROP CONSTRAINT sales_order_state_check;
ALTER TABLE sales.sales_order ADD CONSTRAINT sales_order_state_check CHECK(state IN ('DRAFT','SUBMITTED','CONFIRMED','IN_PRODUCTION'));
ALTER TABLE sales.sales_order DROP CONSTRAINT sales_order_check;
ALTER TABLE sales.sales_order ADD CONSTRAINT order_confirmation CHECK((state IN ('CONFIRMED','IN_PRODUCTION') AND confirmed_at IS NOT NULL AND confirmed_assessment_id IS NOT NULL) OR (state NOT IN ('CONFIRMED','IN_PRODUCTION') AND confirmed_at IS NULL AND confirmed_assessment_id IS NULL));
CREATE TABLE sales.make_reference (
 installation_id uuid NOT NULL, authority_scope uuid NOT NULL,
 production_order_id uuid NOT NULL, order_id uuid NOT NULL, customer_id uuid NOT NULL, item_id uuid NOT NULL,
 issuer text NOT NULL CHECK(length(issuer)>0), subject text NOT NULL CHECK(length(subject)>0),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(installation_id,authority_scope,production_order_id),
 FOREIGN KEY(installation_id,authority_scope,order_id,customer_id) REFERENCES sales.sales_order(installation_id,authority_scope,order_id,customer_id)
);
CREATE FUNCTION sales.make_reference_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP<>'INSERT' THEN RAISE EXCEPTION 'Immutable production demand reference' USING ERRCODE='23514'; END IF;
 IF NOT EXISTS(SELECT 1 FROM sales.sales_order o JOIN sales.fulfillment_assessment a ON a.installation_id=o.installation_id AND a.authority_scope=o.authority_scope AND a.assessment_id=o.confirmed_assessment_id WHERE o.installation_id=NEW.installation_id AND o.authority_scope=NEW.authority_scope AND o.order_id=NEW.order_id AND o.customer_id=NEW.customer_id AND o.state IN ('CONFIRMED','IN_PRODUCTION') AND a.state='RECORDED' AND a.fulfillment_mode='MAKE' AND EXISTS(SELECT 1 FROM jsonb_array_elements(o.items) item WHERE item->>'id'=NEW.item_id::text)) THEN
  RAISE EXCEPTION 'Confirmed MAKE demand required' USING ERRCODE='23514';
 END IF;
 NEW.created_at:=clock_timestamp();
 RETURN NEW;
END;
$$;
CREATE TRIGGER make_reference_guard BEFORE INSERT OR UPDATE OR DELETE ON sales.make_reference FOR EACH ROW EXECUTE FUNCTION sales.make_reference_guard();
CREATE OR REPLACE FUNCTION sales.order_transition() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.state<>'DRAFT' THEN RAISE EXCEPTION 'Invalid initial Sales order state' USING ERRCODE='23514'; END IF;
 ELSE
  IF (to_jsonb(NEW)-ARRAY['state','confirmed_at','confirmed_assessment_id']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['state','confirmed_at','confirmed_assessment_id']) OR NOT ((OLD.state='DRAFT' AND NEW.state='SUBMITTED') OR (OLD.state='SUBMITTED' AND NEW.state='CONFIRMED') OR (OLD.state='CONFIRMED' AND NEW.state='IN_PRODUCTION')) THEN
   RAISE EXCEPTION 'Immutable Sales order or invalid transition' USING ERRCODE='23514';
  END IF;
  IF NEW.state IN ('CONFIRMED','IN_PRODUCTION') AND NOT EXISTS(SELECT 1 FROM sales.fulfillment_assessment a WHERE a.installation_id=NEW.installation_id AND a.authority_scope=NEW.authority_scope AND a.assessment_id=NEW.confirmed_assessment_id AND a.order_id=NEW.order_id AND a.customer_id=NEW.customer_id AND a.state='RECORDED' AND a.order_binding=NEW.binding) THEN RAISE EXCEPTION 'Recorded matching assessment required' USING ERRCODE='23514'; END IF;
  IF NEW.state='IN_PRODUCTION' AND (NEW.confirmed_at IS DISTINCT FROM OLD.confirmed_at OR NEW.confirmed_assessment_id IS DISTINCT FROM OLD.confirmed_assessment_id OR NOT EXISTS(SELECT 1 FROM sales.make_reference r WHERE r.installation_id=NEW.installation_id AND r.authority_scope=NEW.authority_scope AND r.order_id=NEW.order_id AND r.customer_id=NEW.customer_id)) THEN RAISE EXCEPTION 'Released MAKE reference required' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END;
$$;
