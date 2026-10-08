CREATE SCHEMA sales;
CREATE TABLE sales.customer (
 installation_id uuid NOT NULL,
 authority_scope uuid NOT NULL,
 customer_id uuid NOT NULL,
 display_name text NOT NULL CHECK(octet_length(display_name) BETWEEN 1 AND 128),
 provisioned_by text NOT NULL DEFAULT current_user,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(installation_id,authority_scope,customer_id)
);
CREATE TABLE sales.sales_order (
 installation_id uuid NOT NULL,
 authority_scope uuid NOT NULL,
 order_id uuid NOT NULL,
 customer_id uuid NOT NULL,
 customer_name text NOT NULL CHECK(octet_length(customer_name) BETWEEN 1 AND 128),
 items jsonb NOT NULL CHECK(jsonb_typeof(items)='array' AND jsonb_array_length(items) BETWEEN 1 AND 8 AND octet_length(items::text)<=8192),
 commercial_terms text NOT NULL DEFAULT 'NOT_SUPPLIED' CHECK(commercial_terms='NOT_SUPPLIED'),
 binding text NOT NULL CHECK(octet_length(binding) BETWEEN 1 AND 8192),
 state text NOT NULL CHECK(state IN ('DRAFT','SUBMITTED','CONFIRMED')),
 confirmed_at timestamptz,
 confirmed_assessment_id uuid,
 issuer text NOT NULL,
 subject text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(installation_id,authority_scope,order_id),
 UNIQUE(installation_id,authority_scope,order_id,customer_id),
 FOREIGN KEY(installation_id,authority_scope,customer_id) REFERENCES sales.customer(installation_id,authority_scope,customer_id),
 CHECK((state='CONFIRMED' AND confirmed_at IS NOT NULL AND confirmed_assessment_id IS NOT NULL) OR (state<>'CONFIRMED' AND confirmed_at IS NULL AND confirmed_assessment_id IS NULL))
);
CREATE TABLE sales.fulfillment_assessment (
 installation_id uuid NOT NULL,
 authority_scope uuid NOT NULL,
 assessment_id uuid NOT NULL,
 order_id uuid NOT NULL,
 customer_id uuid NOT NULL,
 order_binding text NOT NULL CHECK(octet_length(order_binding) BETWEEN 1 AND 8192),
 binding text NOT NULL CHECK(octet_length(binding) BETWEEN 1 AND 8192),
 state text NOT NULL CHECK(state IN ('DRAFT','RECORDED')),
 selections jsonb,
 stock jsonb,
 observed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(installation_id,authority_scope,assessment_id),
 UNIQUE(installation_id,authority_scope,assessment_id,order_id,customer_id),
 FOREIGN KEY(installation_id,authority_scope,order_id,customer_id) REFERENCES sales.sales_order(installation_id,authority_scope,order_id,customer_id),
 CHECK((state='RECORDED' AND selections IS NOT NULL AND stock IS NOT NULL AND observed_at IS NOT NULL AND jsonb_typeof(selections)='array' AND jsonb_array_length(selections) BETWEEN 1 AND 8 AND jsonb_typeof(stock)='array' AND jsonb_array_length(stock) BETWEEN 1 AND 16 AND octet_length(selections::text)<=8192 AND octet_length(stock::text)<=8192) OR (state='DRAFT' AND selections IS NULL AND stock IS NULL AND observed_at IS NULL))
);
ALTER TABLE sales.sales_order ADD FOREIGN KEY(installation_id,authority_scope,confirmed_assessment_id,order_id,customer_id) REFERENCES sales.fulfillment_assessment(installation_id,authority_scope,assessment_id,order_id,customer_id);
CREATE FUNCTION sales.order_transition() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.state<>'DRAFT' THEN RAISE EXCEPTION 'Invalid initial Sales order state' USING ERRCODE='23514'; END IF;
 ELSE
  IF (to_jsonb(NEW)-ARRAY['state','confirmed_at','confirmed_assessment_id']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['state','confirmed_at','confirmed_assessment_id'])
    OR NOT ((OLD.state='DRAFT' AND NEW.state='SUBMITTED') OR (OLD.state='SUBMITTED' AND NEW.state='CONFIRMED')) THEN
   RAISE EXCEPTION 'Immutable Sales order or invalid transition' USING ERRCODE='23514';
  END IF;
  IF NEW.state='CONFIRMED' AND NOT EXISTS (SELECT 1 FROM sales.fulfillment_assessment a WHERE a.installation_id=NEW.installation_id AND a.authority_scope=NEW.authority_scope AND a.assessment_id=NEW.confirmed_assessment_id AND a.order_id=NEW.order_id AND a.customer_id=NEW.customer_id AND a.state='RECORDED' AND a.order_binding=NEW.binding) THEN
   RAISE EXCEPTION 'Recorded matching assessment required' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER order_transition BEFORE INSERT OR UPDATE ON sales.sales_order FOR EACH ROW EXECUTE FUNCTION sales.order_transition();
CREATE FUNCTION sales.assessment_transition() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.state<>'DRAFT' THEN RAISE EXCEPTION 'Invalid initial assessment state' USING ERRCODE='23514'; END IF;
 ELSE
  IF (to_jsonb(NEW)-ARRAY['state','selections','stock','observed_at']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['state','selections','stock','observed_at']) OR NOT (OLD.state='DRAFT' AND NEW.state='RECORDED') THEN
   RAISE EXCEPTION 'Immutable assessment or invalid transition' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER assessment_transition BEFORE INSERT OR UPDATE ON sales.fulfillment_assessment FOR EACH ROW EXECUTE FUNCTION sales.assessment_transition();
