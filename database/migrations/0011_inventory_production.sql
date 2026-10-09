CREATE TABLE inventory.production_issue (
 installation_id uuid NOT NULL, authority_scope uuid NOT NULL, unit_id uuid NOT NULL,
 production_order_id uuid NOT NULL, customer_id uuid NOT NULL,
 kg numeric NOT NULL CHECK(kg>0 AND scale(kg)<=18 AND kg<100000000000000000000),
 state text NOT NULL DEFAULT 'ACTIVE' CHECK(state IN ('ACTIVE','COMPLETED')),
 issuer text NOT NULL CHECK(octet_length(issuer) BETWEEN 1 AND 256), subject text NOT NULL CHECK(octet_length(subject) BETWEEN 1 AND 256),
 issued_at timestamptz NOT NULL DEFAULT clock_timestamp(), completed_at timestamptz,
 PRIMARY KEY(installation_id,authority_scope,unit_id,production_order_id),
 FOREIGN KEY(installation_id,authority_scope,unit_id) REFERENCES inventory.unit(installation_id,authority_scope,unit_id),
 CHECK((state='ACTIVE' AND completed_at IS NULL) OR (state='COMPLETED' AND completed_at IS NOT NULL))
);
CREATE UNIQUE INDEX production_one_active_issue ON inventory.production_issue(installation_id,authority_scope,unit_id) WHERE state='ACTIVE';
CREATE TABLE inventory.production_origin (
 installation_id uuid NOT NULL, authority_scope uuid NOT NULL, unit_id uuid NOT NULL,
 production_order_id uuid NOT NULL, operation_id uuid NOT NULL, product_batch_id uuid NOT NULL, customer_id uuid NOT NULL,
 source_fact_id uuid NOT NULL, stock_effect_id uuid NOT NULL,
 kg numeric NOT NULL CHECK(kg>0 AND scale(kg)<=18 AND kg<100000000000000000000),
 disposition text NOT NULL CHECK(disposition IN ('FINAL','WIP','RESIDUAL')),
 issuer text NOT NULL CHECK(octet_length(issuer) BETWEEN 1 AND 256), subject text NOT NULL CHECK(octet_length(subject) BETWEEN 1 AND 256),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(installation_id,authority_scope,unit_id),
 UNIQUE(installation_id,authority_scope,source_fact_id),
 FOREIGN KEY(installation_id,authority_scope,unit_id,product_batch_id) REFERENCES inventory.unit(installation_id,authority_scope,unit_id,lot_id),
 FOREIGN KEY(installation_id,authority_scope,stock_effect_id) REFERENCES inventory.ledger(installation_id,authority_scope,effect_id)
);
CREATE FUNCTION inventory.production_issue_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Production issue history is immutable' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.state<>'ACTIVE' OR NOT EXISTS(SELECT 1 FROM inventory.unit u JOIN inventory.balance b USING(installation_id,authority_scope,unit_id) WHERE u.installation_id=NEW.installation_id AND u.authority_scope=NEW.authority_scope AND u.unit_id=NEW.unit_id AND u.state='ISSUED_TO_PRODUCTION' AND (u.customer_scope='' OR u.customer_scope=NEW.customer_id::text) AND b.on_hand=NEW.kg AND b.reserved=0) OR EXISTS(SELECT 1 FROM inventory.reservation r WHERE r.installation_id=NEW.installation_id AND r.authority_scope=NEW.authority_scope AND r.unit_id=NEW.unit_id AND r.state='ACTIVE') THEN RAISE EXCEPTION 'Matching issued unreserved material required' USING ERRCODE='23514'; END IF;
  NEW.issued_at:=clock_timestamp();
 ELSE
  IF (to_jsonb(NEW)-ARRAY['state','completed_at']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['state','completed_at']) OR OLD.state<>'ACTIVE' OR NEW.state<>'COMPLETED' OR NOT EXISTS(SELECT 1 FROM inventory.unit u WHERE u.installation_id=NEW.installation_id AND u.authority_scope=NEW.authority_scope AND u.unit_id=NEW.unit_id AND u.state IN ('CONSUMED','AVAILABLE')) THEN RAISE EXCEPTION 'Invalid or immutable production issue transition' USING ERRCODE='23514'; END IF;
  NEW.completed_at:=clock_timestamp();
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER production_issue_guard BEFORE INSERT OR UPDATE OR DELETE ON inventory.production_issue FOR EACH ROW EXECUTE FUNCTION inventory.production_issue_guard();
CREATE FUNCTION inventory.production_origin_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP<>'INSERT' THEN RAISE EXCEPTION 'Production origin is immutable' USING ERRCODE='23514'; END IF;
 IF NOT EXISTS(SELECT 1 FROM inventory.ledger l JOIN inventory.unit u USING(installation_id,authority_scope,unit_id) WHERE l.installation_id=NEW.installation_id AND l.authority_scope=NEW.authority_scope AND l.unit_id=NEW.unit_id AND l.effect_id=NEW.stock_effect_id AND l.source_fact_id=NEW.source_fact_id AND l.command_id='CompleteProductionOperation' AND l.actor_role='ACT-OP' AND l.on_hand_delta=NEW.kg AND l.reserved_delta=0 AND l.issuer=NEW.issuer AND l.subject=NEW.subject AND u.lot_id=NEW.product_batch_id AND u.customer_scope=NEW.customer_id::text AND u.state=CASE WHEN NEW.disposition='WIP' THEN 'ISSUED_TO_PRODUCTION' ELSE 'AVAILABLE' END) THEN RAISE EXCEPTION 'Matching immutable production output posting required' USING ERRCODE='23514'; END IF;
 NEW.created_at:=clock_timestamp();
 RETURN NEW;
END;
$$;
CREATE TRIGGER production_origin_guard BEFORE INSERT OR UPDATE OR DELETE ON inventory.production_origin FOR EACH ROW EXECUTE FUNCTION inventory.production_origin_guard();
