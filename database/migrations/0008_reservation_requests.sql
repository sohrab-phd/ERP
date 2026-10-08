ALTER TABLE inventory.reservation ADD CONSTRAINT inventory_claim_identity UNIQUE(installation_id,authority_scope,reservation_id,unit_id,demand_id);
CREATE TABLE inventory.reservation_request (
 installation_id uuid NOT NULL,
 authority_scope uuid NOT NULL,
 reservation_id uuid NOT NULL,
 order_id uuid NOT NULL,
 item_id uuid NOT NULL,
 unit_id uuid NOT NULL,
 customer_id uuid NOT NULL,
 kg numeric NOT NULL CHECK(kg>0 AND scale(kg)=0 AND kg<100000000000000000000),
 binding text NOT NULL CHECK(octet_length(binding) BETWEEN 1 AND 8192),
 order_binding text NOT NULL CHECK(octet_length(order_binding) BETWEEN 1 AND 8192),
 confirmed_at timestamptz NOT NULL,
 state text NOT NULL CHECK(state IN ('REQUESTED','ACTIVE')),
 requested_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 activated_at timestamptz,
 active_claim_id uuid,
 issuer text NOT NULL,
 subject text NOT NULL,
 PRIMARY KEY(installation_id,authority_scope,reservation_id),
 FOREIGN KEY(installation_id,authority_scope,unit_id) REFERENCES inventory.unit(installation_id,authority_scope,unit_id),
 FOREIGN KEY(installation_id,authority_scope,active_claim_id,unit_id,order_id) REFERENCES inventory.reservation(installation_id,authority_scope,reservation_id,unit_id,demand_id),
 CHECK((state='REQUESTED' AND activated_at IS NULL AND active_claim_id IS NULL) OR (state='ACTIVE' AND activated_at IS NOT NULL AND active_claim_id IS NOT NULL AND active_claim_id=reservation_id))
);
CREATE INDEX reservation_request_demand ON inventory.reservation_request(installation_id,authority_scope,order_id,item_id);
CREATE FUNCTION inventory.request_transition() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.state<>'REQUESTED' THEN RAISE EXCEPTION 'Invalid initial reservation state' USING ERRCODE='23514'; END IF;
 ELSE
  IF (to_jsonb(NEW)-ARRAY['state','activated_at','active_claim_id']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['state','activated_at','active_claim_id']) OR OLD.state<>'REQUESTED' OR NEW.state<>'ACTIVE' THEN
   RAISE EXCEPTION 'Immutable reservation intent or invalid transition' USING ERRCODE='23514';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM inventory.reservation r WHERE r.installation_id=NEW.installation_id AND r.authority_scope=NEW.authority_scope AND r.reservation_id=NEW.reservation_id AND r.unit_id=NEW.unit_id AND r.demand_id=NEW.order_id AND r.kg=NEW.kg AND r.state='ACTIVE') THEN
   RAISE EXCEPTION 'Matching ACTIVE inventory claim required' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER request_transition BEFORE INSERT OR UPDATE ON inventory.reservation_request FOR EACH ROW EXECUTE FUNCTION inventory.request_transition();
