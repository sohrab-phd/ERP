CREATE SCHEMA shipping;
CREATE TABLE shipping.shipment (
 installation_id uuid NOT NULL, authority_scope uuid NOT NULL, shipment_id uuid NOT NULL,
 order_id uuid NOT NULL, customer_id uuid NOT NULL,
 binding text NOT NULL CHECK(octet_length(binding) BETWEEN 1 AND 8192),
 order_binding text NOT NULL CHECK(octet_length(order_binding) BETWEEN 1 AND 8192),
 state text NOT NULL CHECK(state IN ('DRAFT','READY','LOADING','DISPATCHED')),
 issuer text NOT NULL CHECK(length(issuer)>0), subject text NOT NULL CHECK(length(subject)>0),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 dispatched_at timestamptz, dispatch_issuer text, dispatch_subject text,
 PRIMARY KEY(installation_id,authority_scope,shipment_id),
 CHECK((state='DISPATCHED' AND dispatched_at IS NOT NULL AND dispatch_issuer IS NOT NULL AND dispatch_subject IS NOT NULL) OR (state<>'DISPATCHED' AND dispatched_at IS NULL AND dispatch_issuer IS NULL AND dispatch_subject IS NULL))
);
CREATE TABLE shipping.package (
 installation_id uuid NOT NULL, authority_scope uuid NOT NULL, package_id uuid NOT NULL,
 order_id uuid NOT NULL, customer_id uuid NOT NULL,
 binding text NOT NULL CHECK(octet_length(binding) BETWEEN 1 AND 8192),
 order_binding text NOT NULL CHECK(octet_length(order_binding) BETWEEN 1 AND 8192),
 state text NOT NULL CHECK(state IN ('DRAFT','PACKED','ASSIGNED_TO_SHIPMENT','UNPACKED')),
 shipment_id uuid, issuer text NOT NULL CHECK(length(issuer)>0), subject text NOT NULL CHECK(length(subject)>0),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(installation_id,authority_scope,package_id),
 FOREIGN KEY(installation_id,authority_scope,shipment_id) REFERENCES shipping.shipment(installation_id,authority_scope,shipment_id),
 CHECK((state='ASSIGNED_TO_SHIPMENT' AND shipment_id IS NOT NULL) OR (state<>'ASSIGNED_TO_SHIPMENT' AND shipment_id IS NULL))
);
CREATE TABLE shipping.package_content (
 installation_id uuid NOT NULL, authority_scope uuid NOT NULL, package_id uuid NOT NULL,
 reservation_id uuid NOT NULL, unit_id uuid NOT NULL, item_id uuid NOT NULL,
 kg numeric NOT NULL CHECK(kg>0 AND scale(kg)=0 AND kg<100000000000000000000),
 active boolean NOT NULL DEFAULT false,
 PRIMARY KEY(installation_id,authority_scope,package_id,reservation_id),
 UNIQUE(installation_id,authority_scope,package_id,unit_id),
 FOREIGN KEY(installation_id,authority_scope,package_id) REFERENCES shipping.package(installation_id,authority_scope,package_id)
);
CREATE UNIQUE INDEX package_active_unit ON shipping.package_content(installation_id,authority_scope,unit_id) WHERE active;
CREATE INDEX package_shipment ON shipping.package(installation_id,authority_scope,shipment_id);
CREATE TABLE shipping.dispatch (
 installation_id uuid NOT NULL, authority_scope uuid NOT NULL, shipment_id uuid NOT NULL,
 package_id uuid NOT NULL, reservation_id uuid NOT NULL, unit_id uuid NOT NULL, item_id uuid NOT NULL,
 kg numeric NOT NULL CHECK(kg>0 AND scale(kg)=0 AND kg<100000000000000000000),
 issuer text NOT NULL, subject text NOT NULL, dispatched_at timestamptz NOT NULL,
 outcome text NOT NULL DEFAULT 'ACCEPTED' CHECK(outcome='ACCEPTED'),
 PRIMARY KEY(installation_id,authority_scope,shipment_id,unit_id),
 UNIQUE(installation_id,authority_scope,reservation_id),
 FOREIGN KEY(installation_id,authority_scope,shipment_id) REFERENCES shipping.shipment(installation_id,authority_scope,shipment_id),
 FOREIGN KEY(installation_id,authority_scope,package_id,reservation_id) REFERENCES shipping.package_content(installation_id,authority_scope,package_id,reservation_id)
);
CREATE FUNCTION shipping.package_transition() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Package history is immutable' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.state<>'DRAFT' OR NEW.shipment_id IS NOT NULL THEN RAISE EXCEPTION 'Invalid initial package' USING ERRCODE='23514'; END IF;
  NEW.created_at:=clock_timestamp(); NEW.updated_at:=NEW.created_at;
 ELSE
  IF (to_jsonb(NEW)-ARRAY['state','shipment_id','updated_at']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['state','shipment_id','updated_at']) OR NOT ((OLD.state='DRAFT' AND NEW.state='PACKED') OR (OLD.state='PACKED' AND NEW.state IN ('UNPACKED','ASSIGNED_TO_SHIPMENT'))) THEN
   RAISE EXCEPTION 'Immutable package binding or invalid state' USING ERRCODE='23514';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM shipping.package_content c WHERE c.installation_id=NEW.installation_id AND c.authority_scope=NEW.authority_scope AND c.package_id=NEW.package_id) THEN RAISE EXCEPTION 'Empty package' USING ERRCODE='23514'; END IF;
  IF NEW.state='ASSIGNED_TO_SHIPMENT' AND NOT EXISTS(SELECT 1 FROM shipping.shipment s WHERE s.installation_id=NEW.installation_id AND s.authority_scope=NEW.authority_scope AND s.shipment_id=NEW.shipment_id AND s.state='DRAFT' AND s.order_id=NEW.order_id AND s.customer_id=NEW.customer_id AND s.order_binding=NEW.order_binding) THEN RAISE EXCEPTION 'Package requires matching draft shipment' USING ERRCODE='23514'; END IF;
  NEW.updated_at:=clock_timestamp();
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER package_transition BEFORE INSERT OR UPDATE OR DELETE ON shipping.package FOR EACH ROW EXECUTE FUNCTION shipping.package_transition();
CREATE FUNCTION shipping.content_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE expected_active boolean;
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Package content is immutable' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.active OR NOT EXISTS(SELECT 1 FROM shipping.package p WHERE p.installation_id=NEW.installation_id AND p.authority_scope=NEW.authority_scope AND p.package_id=NEW.package_id AND p.state='DRAFT' AND (p.binding::jsonb->'reservationIds') ? NEW.reservation_id::text) THEN RAISE EXCEPTION 'Only bound draft content may be inserted' USING ERRCODE='23514'; END IF;
 ELSE
  IF (to_jsonb(NEW)-'active') IS DISTINCT FROM (to_jsonb(OLD)-'active') THEN RAISE EXCEPTION 'Immutable package content' USING ERRCODE='23514'; END IF;
  SELECT p.state IN ('PACKED','ASSIGNED_TO_SHIPMENT') AND NOT EXISTS(SELECT 1 FROM shipping.shipment s WHERE s.installation_id=p.installation_id AND s.authority_scope=p.authority_scope AND s.shipment_id=p.shipment_id AND s.state='DISPATCHED') INTO expected_active FROM shipping.package p WHERE p.installation_id=NEW.installation_id AND p.authority_scope=NEW.authority_scope AND p.package_id=NEW.package_id;
  IF expected_active IS DISTINCT FROM NEW.active THEN RAISE EXCEPTION 'Active content must follow package/shipment state' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER content_guard BEFORE INSERT OR UPDATE OR DELETE ON shipping.package_content FOR EACH ROW EXECUTE FUNCTION shipping.content_guard();
CREATE FUNCTION shipping.package_effect() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 UPDATE shipping.package_content SET active=(NEW.state IN ('PACKED','ASSIGNED_TO_SHIPMENT')) WHERE installation_id=NEW.installation_id AND authority_scope=NEW.authority_scope AND package_id=NEW.package_id;
 RETURN NEW;
END;
$$;
CREATE TRIGGER package_effect AFTER UPDATE ON shipping.package FOR EACH ROW EXECUTE FUNCTION shipping.package_effect();
CREATE FUNCTION shipping.shipment_transition() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Shipment history is immutable' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.state<>'DRAFT' THEN RAISE EXCEPTION 'Invalid initial shipment' USING ERRCODE='23514'; END IF;
  NEW.created_at:=clock_timestamp(); NEW.updated_at:=NEW.created_at;
 ELSE
  IF (to_jsonb(NEW)-ARRAY['state','updated_at','dispatched_at','dispatch_issuer','dispatch_subject']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['state','updated_at','dispatched_at','dispatch_issuer','dispatch_subject']) OR NOT ((OLD.state='DRAFT' AND NEW.state='READY') OR (OLD.state='READY' AND NEW.state='LOADING') OR (OLD.state='LOADING' AND NEW.state='DISPATCHED')) THEN RAISE EXCEPTION 'Immutable shipment binding or invalid state' USING ERRCODE='23514'; END IF;
  IF NOT EXISTS(SELECT 1 FROM shipping.package p JOIN shipping.package_content c USING(installation_id,authority_scope,package_id) WHERE p.installation_id=NEW.installation_id AND p.authority_scope=NEW.authority_scope AND p.shipment_id=NEW.shipment_id AND p.state='ASSIGNED_TO_SHIPMENT' AND c.active) THEN RAISE EXCEPTION 'Shipment requires assigned content' USING ERRCODE='23514'; END IF;
  NEW.updated_at:=clock_timestamp();
  IF NEW.state='DISPATCHED' THEN NEW.dispatched_at:=NEW.updated_at; END IF;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER shipment_transition BEFORE INSERT OR UPDATE OR DELETE ON shipping.shipment FOR EACH ROW EXECUTE FUNCTION shipping.shipment_transition();
CREATE FUNCTION shipping.dispatch_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP<>'INSERT' THEN RAISE EXCEPTION 'Dispatch evidence is immutable' USING ERRCODE='23514'; END IF;
 IF NOT EXISTS(SELECT 1 FROM shipping.shipment s JOIN shipping.package p USING(installation_id,authority_scope,shipment_id) JOIN shipping.package_content c USING(installation_id,authority_scope,package_id) WHERE s.installation_id=NEW.installation_id AND s.authority_scope=NEW.authority_scope AND s.shipment_id=NEW.shipment_id AND s.state='DISPATCHED' AND p.package_id=NEW.package_id AND c.reservation_id=NEW.reservation_id AND c.unit_id=NEW.unit_id AND c.item_id=NEW.item_id AND c.kg=NEW.kg AND s.dispatch_issuer=NEW.issuer AND s.dispatch_subject=NEW.subject AND s.dispatched_at=NEW.dispatched_at) THEN RAISE EXCEPTION 'Dispatch evidence must match immutable shipment content' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER dispatch_guard BEFORE INSERT OR UPDATE OR DELETE ON shipping.dispatch FOR EACH ROW EXECUTE FUNCTION shipping.dispatch_guard();
CREATE FUNCTION shipping.shipment_effect() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.state='DISPATCHED' THEN
  INSERT INTO shipping.dispatch(installation_id,authority_scope,shipment_id,package_id,reservation_id,unit_id,item_id,kg,issuer,subject,dispatched_at)
   SELECT NEW.installation_id,NEW.authority_scope,NEW.shipment_id,p.package_id,c.reservation_id,c.unit_id,c.item_id,c.kg,NEW.dispatch_issuer,NEW.dispatch_subject,NEW.dispatched_at FROM shipping.package p JOIN shipping.package_content c USING(installation_id,authority_scope,package_id) WHERE p.installation_id=NEW.installation_id AND p.authority_scope=NEW.authority_scope AND p.shipment_id=NEW.shipment_id;
  UPDATE shipping.package_content c SET active=false FROM shipping.package p WHERE p.installation_id=NEW.installation_id AND p.authority_scope=NEW.authority_scope AND p.shipment_id=NEW.shipment_id AND c.installation_id=p.installation_id AND c.authority_scope=p.authority_scope AND c.package_id=p.package_id;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER shipment_effect AFTER UPDATE ON shipping.shipment FOR EACH ROW EXECUTE FUNCTION shipping.shipment_effect();
