ALTER TABLE inventory.reservation_request DROP CONSTRAINT reservation_request_state_check;
ALTER TABLE inventory.reservation_request DROP CONSTRAINT reservation_request_check;
ALTER TABLE inventory.reservation_request ADD COLUMN dispatch_id uuid;
ALTER TABLE inventory.reservation_request ADD COLUMN consumed_at timestamptz;
ALTER TABLE inventory.reservation_request ADD COLUMN consume_effect_id uuid;
ALTER TABLE inventory.reservation_request ADD COLUMN out_effect_id uuid;
ALTER TABLE inventory.reservation_request ADD CONSTRAINT reservation_request_state_check CHECK(state IN ('REQUESTED','ACTIVE','CONSUMED'));
ALTER TABLE inventory.reservation_request ADD CONSTRAINT reservation_request_lifecycle CHECK(
 (state='REQUESTED' AND activated_at IS NULL AND active_claim_id IS NULL AND dispatch_id IS NULL AND consumed_at IS NULL AND consume_effect_id IS NULL AND out_effect_id IS NULL) OR
 (state='ACTIVE' AND activated_at IS NOT NULL AND active_claim_id IS NOT NULL AND active_claim_id=reservation_id AND dispatch_id IS NULL AND consumed_at IS NULL AND consume_effect_id IS NULL AND out_effect_id IS NULL) OR
 (state='CONSUMED' AND activated_at IS NOT NULL AND active_claim_id=reservation_id AND dispatch_id IS NOT NULL AND consumed_at IS NOT NULL AND consume_effect_id IS NOT NULL AND out_effect_id IS NOT NULL AND consume_effect_id<>out_effect_id)
);
ALTER TABLE inventory.reservation_request ADD CONSTRAINT consumed_claim_effect FOREIGN KEY(installation_id,authority_scope,consume_effect_id) REFERENCES inventory.ledger(installation_id,authority_scope,effect_id);
ALTER TABLE inventory.reservation_request ADD CONSTRAINT dispatched_stock_effect FOREIGN KEY(installation_id,authority_scope,out_effect_id) REFERENCES inventory.ledger(installation_id,authority_scope,effect_id);
CREATE OR REPLACE FUNCTION inventory.request_transition() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.state<>'REQUESTED' THEN RAISE EXCEPTION 'Invalid initial reservation state' USING ERRCODE='23514'; END IF;
 ELSE
  IF (to_jsonb(NEW)-ARRAY['state','activated_at','active_claim_id','dispatch_id','consumed_at','consume_effect_id','out_effect_id']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['state','activated_at','active_claim_id','dispatch_id','consumed_at','consume_effect_id','out_effect_id']) THEN
   RAISE EXCEPTION 'Immutable reservation intent' USING ERRCODE='23514';
  END IF;
  IF OLD.state='REQUESTED' AND NEW.state='ACTIVE' THEN
   IF NOT EXISTS(SELECT 1 FROM inventory.reservation r WHERE r.installation_id=NEW.installation_id AND r.authority_scope=NEW.authority_scope AND r.reservation_id=NEW.reservation_id AND r.unit_id=NEW.unit_id AND r.demand_id=NEW.order_id AND r.kg=NEW.kg AND r.state='ACTIVE') THEN
    RAISE EXCEPTION 'Matching ACTIVE inventory claim required' USING ERRCODE='23514';
   END IF;
  ELSIF OLD.state='ACTIVE' AND NEW.state='CONSUMED' THEN
   IF NEW.activated_at IS DISTINCT FROM OLD.activated_at OR NEW.active_claim_id IS DISTINCT FROM OLD.active_claim_id OR NOT EXISTS(
    SELECT 1 FROM inventory.reservation r JOIN inventory.unit u ON u.installation_id=r.installation_id AND u.authority_scope=r.authority_scope AND u.unit_id=r.unit_id
    WHERE r.installation_id=NEW.installation_id AND r.authority_scope=NEW.authority_scope AND r.reservation_id=NEW.reservation_id AND r.unit_id=NEW.unit_id AND r.demand_id=NEW.order_id AND r.kg=NEW.kg AND r.state='CONSUMED' AND u.state='SHIPPED'
   ) OR NOT EXISTS(
    SELECT 1 FROM inventory.ledger l WHERE l.installation_id=NEW.installation_id AND l.authority_scope=NEW.authority_scope AND l.unit_id=NEW.unit_id AND l.effect_id=NEW.consume_effect_id AND l.source_fact_id=NEW.dispatch_id AND l.command_id='DispatchShipment' AND l.actor_role='ACT-SHIP' AND l.on_hand_delta=0 AND l.reserved_delta=-NEW.kg
   ) OR NOT EXISTS(
    SELECT 1 FROM inventory.ledger l WHERE l.installation_id=NEW.installation_id AND l.authority_scope=NEW.authority_scope AND l.unit_id=NEW.unit_id AND l.effect_id=NEW.out_effect_id AND l.source_fact_id=NEW.dispatch_id AND l.command_id='DispatchShipment' AND l.actor_role='ACT-SHIP' AND l.on_hand_delta=-NEW.kg AND l.reserved_delta=0
   ) THEN
    RAISE EXCEPTION 'Matching immutable dispatch evidence required' USING ERRCODE='23514';
   END IF;
  ELSE
   RAISE EXCEPTION 'Invalid reservation intent transition' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NEW;
END;
$$;
