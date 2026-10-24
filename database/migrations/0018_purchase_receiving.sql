-- I2 immutable receiving sources and owner-published stock provenance.
-- No historical backfill, second stock writer, or independent transaction owner.
CREATE TABLE procurement.inbound_arrival (
 installation_id uuid NOT NULL, authority_scope uuid NOT NULL CHECK(authority_scope=installation_id), arrival_id uuid NOT NULL,
 arrival_jy smallint NOT NULL, arrival_jm smallint NOT NULL, arrival_jd smallint NOT NULL,
 calendar_profile text NOT NULL DEFAULT 'UT-JALALI-1206-1498-v1' CHECK(calendar_profile='UT-JALALI-1206-1498-v1'),
 unit_count integer NOT NULL CHECK(unit_count>0), waybill_count integer NOT NULL CHECK(waybill_count>0 AND waybill_count<=unit_count), receipt_count integer NOT NULL CHECK(receipt_count>0 AND receipt_count<=unit_count),
 origin_net_kg_text text COLLATE "C" NOT NULL CHECK(octet_length(origin_net_kg_text) BETWEEN 1 AND 65536 AND origin_net_kg_text ~ '^[0-9]+([.][0-9]+)?$'),
 destination_net_kg_text text COLLATE "C" CHECK(destination_net_kg_text IS NULL OR (octet_length(destination_net_kg_text) BETWEEN 1 AND 65536 AND destination_net_kg_text ~ '^[0-9]+([.][0-9]+)?$')),
 weight_source_waybill_id uuid NOT NULL,
 truck_number text CHECK(truck_number IS NULL OR (char_length(truck_number) BETWEEN 1 AND 128 AND octet_length(truck_number)<=512 AND truck_number !~ U&'[\0001-\001F\007F-\009F]' AND translate(truck_number,U&'\0009\000A\000B\000C\000D \00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF','')<>'')),
 originating_company text CHECK(originating_company IS NULL OR (char_length(originating_company) BETWEEN 1 AND 128 AND octet_length(originating_company)<=512 AND originating_company !~ U&'[\0001-\001F\007F-\009F]' AND translate(originating_company,U&'\0009\000A\000B\000C\000D \00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF','')<>'')),
 driver_name text CHECK(driver_name IS NULL OR (char_length(driver_name) BETWEEN 1 AND 128 AND octet_length(driver_name)<=512 AND driver_name !~ U&'[\0001-\001F\007F-\009F]' AND translate(driver_name,U&'\0009\000A\000B\000C\000D \00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF','')<>'')),
 binding text NOT NULL CHECK(octet_length(binding) BETWEEN 1 AND 262144),
 issuer text NOT NULL CHECK(octet_length(issuer) BETWEEN 1 AND 256), subject text NOT NULL CHECK(octet_length(subject) BETWEEN 1 AND 256), actor_role text NOT NULL CHECK(actor_role='ACT-WH'),
 request_id uuid NOT NULL,idempotency_key uuid NOT NULL,recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CONSTRAINT i2_arrival_pk PRIMARY KEY(installation_id,authority_scope,arrival_id),
 CONSTRAINT i2_arrival_counts_uq UNIQUE(installation_id,authority_scope,arrival_id,unit_count),
 CONSTRAINT i2_arrival_waybill_count_uq UNIQUE(installation_id,authority_scope,arrival_id,waybill_count),
 CONSTRAINT i2_arrival_receipt_count_uq UNIQUE(installation_id,authority_scope,arrival_id,receipt_count),
 CONSTRAINT i2_arrival_jalali_ck CHECK(arrival_jy BETWEEN 1206 AND 1498 AND arrival_jm BETWEEN 1 AND 12 AND arrival_jd>=1 AND arrival_jd<=CASE WHEN arrival_jm<=6 THEN 31 WHEN arrival_jm<=11 THEN 30 WHEN arrival_jy IN(1210,1214,1218,1222,1226,1230,1234,1238,1243,1247,1251,1255,1259,1263,1267,1271,1276,1280,1284,1288,1292,1296,1300,1304,1309,1313,1317,1321,1325,1329,1333,1337,1342,1346,1350,1354,1358,1362,1366,1370,1375,1379,1383,1387,1391,1395,1399,1403,1408,1412,1416,1420,1424,1428,1432,1436,1441,1445,1449,1453,1457,1461,1465,1469,1474,1478,1482,1486,1490,1494,1498) THEN 30 ELSE 29 END)
);
CREATE TABLE procurement.inbound_waybill (
 installation_id uuid NOT NULL,authority_scope uuid NOT NULL CHECK(authority_scope=installation_id),waybill_id uuid NOT NULL,arrival_id uuid NOT NULL,
 position integer NOT NULL, declared_waybill_count integer NOT NULL CHECK(declared_waybill_count>0 AND position BETWEEN 1 AND declared_waybill_count),
 reference text COLLATE "C" NOT NULL CHECK((char_length(reference) BETWEEN 1 AND 128 AND octet_length(reference)<=512 AND reference !~ U&'[\0001-\001F\007F-\009F]' AND translate(reference,U&'\0009\000A\000B\000C\000D \00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF','')<>'')), yellow_copy_reference text CHECK(yellow_copy_reference IS NULL OR (char_length(yellow_copy_reference) BETWEEN 1 AND 128 AND octet_length(yellow_copy_reference)<=512 AND yellow_copy_reference !~ U&'[\0001-\001F\007F-\009F]' AND translate(yellow_copy_reference,U&'\0009\000A\000B\000C\000D \00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF','')<>'')),
 CONSTRAINT i2_waybill_pk PRIMARY KEY(installation_id,authority_scope,waybill_id),
 CONSTRAINT i2_waybill_reference_uq UNIQUE(installation_id,reference),
 CONSTRAINT i2_waybill_arrival_identity_uq UNIQUE(installation_id,authority_scope,arrival_id,waybill_id),
 CONSTRAINT i2_waybill_position_uq UNIQUE(installation_id,authority_scope,arrival_id,position),
 CONSTRAINT i2_waybill_parent_fk FOREIGN KEY(installation_id,authority_scope,arrival_id,declared_waybill_count) REFERENCES procurement.inbound_arrival(installation_id,authority_scope,arrival_id,waybill_count)
);
CREATE TABLE procurement.inbound_warehouse_receipt (
 installation_id uuid NOT NULL,authority_scope uuid NOT NULL CHECK(authority_scope=installation_id),receipt_id uuid NOT NULL,arrival_id uuid NOT NULL,
 position integer NOT NULL,declared_receipt_count integer NOT NULL CHECK(declared_receipt_count>0 AND position BETWEEN 1 AND declared_receipt_count),
 reference text COLLATE "C" NOT NULL CHECK((char_length(reference) BETWEEN 1 AND 128 AND octet_length(reference)<=512 AND reference !~ U&'[\0001-\001F\007F-\009F]' AND translate(reference,U&'\0009\000A\000B\000C\000D \00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF','')<>'')),
 CONSTRAINT i2_receipt_pk PRIMARY KEY(installation_id,authority_scope,receipt_id),
 CONSTRAINT i2_receipt_reference_uq UNIQUE(installation_id,reference),
 CONSTRAINT i2_receipt_arrival_identity_uq UNIQUE(installation_id,authority_scope,arrival_id,receipt_id),
 CONSTRAINT i2_receipt_position_uq UNIQUE(installation_id,authority_scope,arrival_id,position),
 CONSTRAINT i2_receipt_parent_fk FOREIGN KEY(installation_id,authority_scope,arrival_id,declared_receipt_count) REFERENCES procurement.inbound_arrival(installation_id,authority_scope,arrival_id,receipt_count)
);
ALTER TABLE procurement.inbound_arrival ADD CONSTRAINT i2_arrival_weight_waybill_fk FOREIGN KEY(installation_id,authority_scope,arrival_id,weight_source_waybill_id) REFERENCES procurement.inbound_waybill(installation_id,authority_scope,arrival_id,waybill_id) DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE procurement.inbound_received_unit (
 installation_id uuid NOT NULL,authority_scope uuid NOT NULL CHECK(authority_scope=installation_id),received_unit_id uuid NOT NULL,arrival_id uuid NOT NULL,
 position integer NOT NULL,declared_unit_count integer NOT NULL CHECK(declared_unit_count>0 AND position BETWEEN 1 AND declared_unit_count),waybill_id uuid NOT NULL,receipt_id uuid NOT NULL,
 internal_system_code text COLLATE "C" NOT NULL CHECK((char_length(internal_system_code) BETWEEN 1 AND 128 AND octet_length(internal_system_code)<=512 AND internal_system_code !~ U&'[\0001-\001F\007F-\009F]' AND translate(internal_system_code,U&'\0009\000A\000B\000C\000D \00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF','')<>'')),product_number text NOT NULL CHECK((char_length(product_number) BETWEEN 1 AND 128 AND octet_length(product_number)<=512 AND product_number !~ U&'[\0001-\001F\007F-\009F]' AND translate(product_number,U&'\0009\000A\000B\000C\000D \00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF','')<>'')),
 association_kind text NOT NULL CHECK(association_kind IN('ORDER_LINE','ORDER_ONLY','UNLINKED')),order_id uuid,line_id uuid,
 actual jsonb NOT NULL CHECK(jsonb_typeof(actual)='object'),original jsonb CHECK(original IS NULL OR jsonb_typeof(original)='object'),comparison jsonb NOT NULL CHECK(jsonb_typeof(comparison)='object'),acceptance jsonb NOT NULL CHECK(jsonb_typeof(acceptance)='object' AND acceptance ? 'confirmed' AND acceptance->'confirmed'='true'::jsonb),
 material_type_option_id uuid NOT NULL,technical_type text NOT NULL CHECK(technical_type IN('COIL','SHEET','ANGLE','BEAM','OTHER')),
 accepted_unit_weight_kg_text text COLLATE "C" NOT NULL CHECK(accepted_unit_weight_kg_text ~ '^[1-9][0-9]{0,19}$'),location_id uuid NOT NULL,
 weight_evidence_reference text CHECK(weight_evidence_reference IS NULL OR (char_length(weight_evidence_reference) BETWEEN 1 AND 128 AND octet_length(weight_evidence_reference)<=512 AND weight_evidence_reference !~ U&'[\0001-\001F\007F-\009F]' AND translate(weight_evidence_reference,U&'\0009\000A\000B\000C\000D \00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF','')<>'')),
 binding text NOT NULL CHECK(octet_length(binding) BETWEEN 1 AND 262144),issuer text NOT NULL CHECK(octet_length(issuer) BETWEEN 1 AND 256),subject text NOT NULL CHECK(octet_length(subject) BETWEEN 1 AND 256),actor_role text NOT NULL CHECK(actor_role='ACT-WH'),request_id uuid NOT NULL,idempotency_key uuid NOT NULL,recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CONSTRAINT i2_received_unit_pk PRIMARY KEY(installation_id,authority_scope,received_unit_id),
 CONSTRAINT i2_received_unit_arrival_uq UNIQUE(installation_id,authority_scope,arrival_id,received_unit_id),
 CONSTRAINT i2_received_unit_position_uq UNIQUE(installation_id,authority_scope,arrival_id,position),
 CONSTRAINT i2_received_unit_parent_fk FOREIGN KEY(installation_id,authority_scope,arrival_id,declared_unit_count) REFERENCES procurement.inbound_arrival(installation_id,authority_scope,arrival_id,unit_count),
 CONSTRAINT i2_received_waybill_fk FOREIGN KEY(installation_id,authority_scope,arrival_id,waybill_id) REFERENCES procurement.inbound_waybill(installation_id,authority_scope,arrival_id,waybill_id),
 CONSTRAINT i2_received_receipt_fk FOREIGN KEY(installation_id,authority_scope,arrival_id,receipt_id) REFERENCES procurement.inbound_warehouse_receipt(installation_id,authority_scope,arrival_id,receipt_id),
 CONSTRAINT i2_received_order_fk FOREIGN KEY(installation_id,authority_scope,order_id) REFERENCES procurement.operational_purchase_order,
 CONSTRAINT i2_received_line_fk FOREIGN KEY(installation_id,authority_scope,order_id,line_id) REFERENCES procurement.operational_purchase_order_line(installation_id,authority_scope,order_id,line_id),
 CONSTRAINT i2_received_material_fk FOREIGN KEY(installation_id,authority_scope,material_type_option_id) REFERENCES procurement.inbound_catalogue_option,
 CONSTRAINT i2_received_association_ck CHECK((association_kind='ORDER_LINE' AND order_id IS NOT NULL AND line_id IS NOT NULL AND original IS NOT NULL) OR (association_kind='ORDER_ONLY' AND order_id IS NOT NULL AND line_id IS NULL AND original IS NULL) OR (association_kind='UNLINKED' AND order_id IS NULL AND line_id IS NULL AND original IS NULL))
);
CREATE INDEX i2_received_order_idx ON procurement.inbound_received_unit(installation_id,authority_scope,order_id,arrival_id,position);
CREATE INDEX i2_received_line_idx ON procurement.inbound_received_unit(installation_id,authority_scope,line_id);
CREATE FUNCTION procurement.i2_received_actual_guard() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE value text; field text; selected jsonb; expected_kind text;
BEGIN
 IF NEW.association_kind IN('ORDER_ONLY','UNLINKED') AND (NEW.acceptance->'unordered') IS DISTINCT FROM 'true'::jsonb THEN
  RAISE EXCEPTION 'Unordered unit requires explicit manual acceptance' USING ERRCODE='23514',CONSTRAINT='i2_received_actual_ck';
 END IF;
 IF NEW.association_kind='ORDER_LINE' AND (NEW.original->>'unitWeightKg') IS DISTINCT FROM NEW.accepted_unit_weight_kg_text AND (NEW.acceptance->'changedW1') IS DISTINCT FROM 'true'::jsonb THEN
  RAISE EXCEPTION 'Changed unit weight requires explicit manual acceptance' USING ERRCODE='23514',CONSTRAINT='i2_received_actual_ck';
 END IF;
 IF NEW.actual->>'unitWeightKg' IS DISTINCT FROM NEW.accepted_unit_weight_kg_text
 OR NEW.actual->'materialType'->>'optionId' IS DISTINCT FROM NEW.material_type_option_id::text
 OR NOT EXISTS(SELECT 1 FROM procurement.inbound_catalogue_option c WHERE c.installation_id=NEW.installation_id AND c.authority_scope=NEW.authority_scope AND c.option_id=NEW.material_type_option_id AND c.catalogue_kind='MATERIAL_TYPE' AND c.label COLLATE "C"=(NEW.actual->'materialType'->>'label') COLLATE "C") THEN
  RAISE EXCEPTION 'Actual unit source must match its weight and catalogue evidence' USING ERRCODE='23514',CONSTRAINT='i2_received_actual_ck';
 END IF;
 FOREACH field IN ARRAY ARRAY['widthM','thicknessMm','lengthM'] LOOP
  value:=NEW.actual->>field;
  IF field='lengthM' AND value IS NULL THEN CONTINUE; END IF;
  IF value IS NULL OR length(value)>39 OR value !~ '^(0|[1-9][0-9]{0,19})([.][0-9]{1,18})?$' THEN
   RAISE EXCEPTION 'Actual unit requires exact positive dimensions' USING ERRCODE='23514',CONSTRAINT='i2_received_actual_ck';
  END IF;
  IF value::numeric<=0 OR value::numeric>=100000000000000000000 THEN
   RAISE EXCEPTION 'Actual unit requires exact positive dimensions' USING ERRCODE='23514',CONSTRAINT='i2_received_actual_ck';
  END IF;
 END LOOP;
 FOREACH field IN ARRAY ARRAY['color','qualityGrade'] LOOP
  selected:=NEW.actual->field;
  IF selected IS NULL OR selected='null'::jsonb THEN CONTINUE; END IF;
  expected_kind:=CASE WHEN field='color' THEN 'COLOR' ELSE 'QUALITY_GRADE' END;
  IF NOT EXISTS(SELECT 1 FROM procurement.inbound_catalogue_option c WHERE c.installation_id=NEW.installation_id AND c.authority_scope=NEW.authority_scope AND c.option_id::text=selected->>'optionId' AND c.catalogue_kind=expected_kind AND c.label COLLATE "C"=(selected->>'label') COLLATE "C") THEN
   RAISE EXCEPTION 'Actual unit catalogue selection requires same-scope evidence' USING ERRCODE='23514',CONSTRAINT='i2_received_actual_ck';
  END IF;
 END LOOP;
 IF NEW.association_kind='ORDER_LINE' AND NOT EXISTS(SELECT 1 FROM procurement.operational_purchase_order_line l WHERE l.installation_id=NEW.installation_id AND l.authority_scope=NEW.authority_scope AND l.order_id=NEW.order_id AND l.line_id=NEW.line_id AND NEW.original->>'lineId'=l.line_id::text AND NEW.original->>'unitWeightKg'=l.unit_weight_kg_text) THEN
  RAISE EXCEPTION 'Original ordered snapshot requires its immutable source' USING ERRCODE='23514',CONSTRAINT='i2_received_actual_ck';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION procurement.i2_received_actual_guard() FROM PUBLIC;
CREATE TRIGGER i2_received_actual_guard BEFORE INSERT ON procurement.inbound_received_unit FOR EACH ROW EXECUTE FUNCTION procurement.i2_received_actual_guard();
CREATE TABLE inventory.inbound_unit_origin (
 installation_id uuid NOT NULL,authority_scope uuid NOT NULL CHECK(authority_scope=installation_id),unit_id uuid NOT NULL,received_unit_id uuid NOT NULL,arrival_id uuid NOT NULL,lot_id uuid NOT NULL,material_id uuid NOT NULL,effect_id uuid NOT NULL,
 internal_system_code text COLLATE "C" NOT NULL CHECK((char_length(internal_system_code) BETWEEN 1 AND 128 AND octet_length(internal_system_code)<=512 AND internal_system_code !~ U&'[\0001-\001F\007F-\009F]' AND translate(internal_system_code,U&'\0009\000A\000B\000C\000D \00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF','')<>'')),product_number text NOT NULL CHECK((char_length(product_number) BETWEEN 1 AND 128 AND octet_length(product_number)<=512 AND product_number !~ U&'[\0001-\001F\007F-\009F]' AND translate(product_number,U&'\0009\000A\000B\000C\000D \00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF','')<>'')),material_type_option_id uuid NOT NULL,
 accepted_unit_weight_kg_text text NOT NULL CHECK(accepted_unit_weight_kg_text ~ '^[1-9][0-9]{0,19}$'),type text NOT NULL CHECK(type IN('COIL','SHEET','ANGLE','BEAM','OTHER')),location_id uuid NOT NULL,
 weight_basis text NOT NULL CHECK(weight_basis='WH_ACCEPTED_DECLARED_UNIT_WEIGHT'),classification_profile text NOT NULL CHECK(classification_profile='FACTORY_MATERIAL_V1'),
 issuer text NOT NULL,subject text NOT NULL,actor_role text NOT NULL CHECK(actor_role='ACT-WH'),request_id uuid NOT NULL,idempotency_key uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CONSTRAINT i2_origin_pk PRIMARY KEY(installation_id,authority_scope,unit_id),
 CONSTRAINT i2_origin_source_uq UNIQUE(installation_id,authority_scope,received_unit_id),
 CONSTRAINT i2_origin_lot_uq UNIQUE(installation_id,authority_scope,lot_id),
 CONSTRAINT i2_origin_material_uq UNIQUE(installation_id,authority_scope,material_id),
 CONSTRAINT i2_origin_effect_uq UNIQUE(installation_id,authority_scope,effect_id),
 CONSTRAINT i2_origin_source_fk FOREIGN KEY(installation_id,authority_scope,arrival_id,received_unit_id) REFERENCES procurement.inbound_received_unit(installation_id,authority_scope,arrival_id,received_unit_id),
 CONSTRAINT i2_origin_unit_fk FOREIGN KEY(installation_id,authority_scope,unit_id,lot_id) REFERENCES inventory.unit(installation_id,authority_scope,unit_id,lot_id),
 CONSTRAINT i2_origin_effect_fk FOREIGN KEY(installation_id,authority_scope,effect_id) REFERENCES inventory.ledger(installation_id,authority_scope,effect_id)
);
CREATE TABLE procurement.inbound_physical_code_claim (
 installation_id uuid NOT NULL,authority_scope uuid NOT NULL,raw_code text COLLATE "C" NOT NULL,legacy_receipt_id uuid,received_unit_id uuid,recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CONSTRAINT i2_code_claim_pk PRIMARY KEY(installation_id,raw_code),
 CONSTRAINT i2_code_claim_legacy_uq UNIQUE(installation_id,authority_scope,legacy_receipt_id),
 CONSTRAINT i2_code_claim_received_uq UNIQUE(installation_id,authority_scope,received_unit_id),
 CONSTRAINT i2_code_claim_kind_ck CHECK((legacy_receipt_id IS NULL)<>(received_unit_id IS NULL)),
 CONSTRAINT i2_code_claim_legacy_fk FOREIGN KEY(installation_id,authority_scope,legacy_receipt_id) REFERENCES procurement.goods_receipt DEFERRABLE INITIALLY DEFERRED,
 CONSTRAINT i2_code_claim_received_fk FOREIGN KEY(installation_id,authority_scope,received_unit_id) REFERENCES procurement.inbound_received_unit DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX i2_legacy_code_idx ON procurement.goods_receipt(installation_id,(internal_code COLLATE "C"));

-- Restricted trigger derives the claim from its source; runtime cannot mint claims.
CREATE FUNCTION procurement.i2_claim_physical_code() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE raw text; old_id uuid; new_id uuid;
BEGIN
 IF TG_TABLE_NAME='goods_receipt' THEN raw:=NEW.internal_code;old_id:=NEW.receipt_id;
 ELSE raw:=NEW.internal_system_code;new_id:=NEW.received_unit_id; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('procurement-physical-code/'||NEW.installation_id::text||'/'||raw,0));
 IF EXISTS(SELECT 1 FROM procurement.goods_receipt g WHERE g.installation_id=NEW.installation_id AND g.internal_code COLLATE "C"=raw COLLATE "C" AND (old_id IS NULL OR g.authority_scope<>NEW.authority_scope OR g.receipt_id<>old_id)) THEN
  RAISE EXCEPTION 'Physical unit system code already exists' USING ERRCODE='23505',CONSTRAINT='i2_code_claim_pk';
 END IF;
 INSERT INTO procurement.inbound_physical_code_claim(installation_id,authority_scope,raw_code,legacy_receipt_id,received_unit_id) VALUES(NEW.installation_id,NEW.authority_scope,raw,old_id,new_id);
 RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION procurement.i2_claim_physical_code() FROM PUBLIC;
CREATE TRIGGER i2_legacy_code_claim AFTER INSERT ON procurement.goods_receipt FOR EACH ROW EXECUTE FUNCTION procurement.i2_claim_physical_code();
CREATE TRIGGER i2_received_code_claim AFTER INSERT ON procurement.inbound_received_unit FOR EACH ROW EXECUTE FUNCTION procurement.i2_claim_physical_code();

CREATE FUNCTION procurement.i2_immutable() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN RAISE EXCEPTION 'Confirmed receiving source is immutable' USING ERRCODE='23514',CONSTRAINT='i2_source_immutable_ck'; END $$;
REVOKE ALL ON FUNCTION procurement.i2_immutable() FROM PUBLIC;
CREATE TRIGGER i2_arrival_immutable BEFORE UPDATE OR DELETE ON procurement.inbound_arrival FOR EACH ROW EXECUTE FUNCTION procurement.i2_immutable();
CREATE TRIGGER i2_waybill_immutable BEFORE UPDATE OR DELETE ON procurement.inbound_waybill FOR EACH ROW EXECUTE FUNCTION procurement.i2_immutable();
CREATE TRIGGER i2_receipt_immutable BEFORE UPDATE OR DELETE ON procurement.inbound_warehouse_receipt FOR EACH ROW EXECUTE FUNCTION procurement.i2_immutable();
CREATE TRIGGER i2_received_immutable BEFORE UPDATE OR DELETE ON procurement.inbound_received_unit FOR EACH ROW EXECUTE FUNCTION procurement.i2_immutable();
CREATE TRIGGER i2_claim_immutable BEFORE UPDATE OR DELETE ON procurement.inbound_physical_code_claim FOR EACH ROW EXECUTE FUNCTION procurement.i2_immutable();
CREATE TRIGGER i2_origin_immutable BEFORE UPDATE OR DELETE ON inventory.inbound_unit_origin FOR EACH ROW EXECUTE FUNCTION procurement.i2_immutable();

-- Old receipt lifecycle can still assign state/stock IDs; its immutable identity cannot change.
CREATE FUNCTION procurement.i2_legacy_identity_guard() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
 IF TG_OP='DELETE' OR (to_jsonb(NEW)-ARRAY['state','lot_id','unit_id','material_id','effect_id']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['state','lot_id','unit_id','material_id','effect_id']) THEN
  RAISE EXCEPTION 'Receipt source identity is immutable' USING ERRCODE='23514',CONSTRAINT='i2_legacy_identity_ck';
 END IF;
 IF NOT ((OLD.state='DRAFT' AND NEW.state='RECEIVED' AND NEW.lot_id IS NULL AND NEW.unit_id IS NULL AND NEW.material_id IS NULL AND NEW.effect_id IS NULL)
 OR (OLD.state='RECEIVED' AND NEW.state='POSTED' AND NEW.lot_id IS NOT NULL AND NEW.unit_id IS NOT NULL AND NEW.material_id IS NOT NULL AND NEW.effect_id IS NOT NULL)
 OR to_jsonb(NEW)=to_jsonb(OLD)) THEN
  RAISE EXCEPTION 'Receipt source transition is immutable after posting' USING ERRCODE='23514',CONSTRAINT='i2_legacy_identity_ck';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION procurement.i2_legacy_identity_guard() FROM PUBLIC;
CREATE TRIGGER i2_legacy_identity BEFORE UPDATE OR DELETE ON procurement.goods_receipt FOR EACH ROW EXECUTE FUNCTION procurement.i2_legacy_identity_guard();
ALTER TABLE procurement.goods_receipt ADD CONSTRAINT i2_legacy_source_code_uq UNIQUE(installation_id,authority_scope,receipt_id,internal_code);
-- Historical mirrors must agree byte-for-byte even under a nondeterministic
-- database collation. Fail closed without exposing or rewriting business data.
DO $i2_legacy_mirror_preflight$
BEGIN
 IF EXISTS(
  SELECT 1 FROM inventory.material_lot m
  JOIN procurement.goods_receipt g ON g.installation_id=m.installation_id AND g.authority_scope=m.authority_scope AND g.receipt_id=m.receipt_id
  WHERE m.internal_code COLLATE "C" IS DISTINCT FROM g.internal_code COLLATE "C"
 ) THEN
  RAISE EXCEPTION 'Historical receipt-origin identity requires reconciliation before I2 migration'
   USING ERRCODE='23514',CONSTRAINT='i2_legacy_mirror_preflight_ck';
 END IF;
END $i2_legacy_mirror_preflight$;
ALTER TABLE inventory.material_lot ADD CONSTRAINT i2_legacy_source_code_fk FOREIGN KEY(installation_id,authority_scope,receipt_id,internal_code) REFERENCES procurement.goods_receipt(installation_id,authority_scope,receipt_id,internal_code);
CREATE FUNCTION inventory.i2_legacy_code_exact() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM procurement.goods_receipt g WHERE g.installation_id=NEW.installation_id AND g.authority_scope=NEW.authority_scope AND g.receipt_id=NEW.receipt_id AND g.internal_code COLLATE "C"=NEW.internal_code COLLATE "C") THEN
  RAISE EXCEPTION 'Material origin code differs from receipt' USING ERRCODE='23514',CONSTRAINT='i2_legacy_code_exact_ck';
 END IF; RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION inventory.i2_legacy_code_exact() FROM PUBLIC;
CREATE TRIGGER i2_legacy_code_exact BEFORE INSERT OR UPDATE ON inventory.material_lot FOR EACH ROW EXECUTE FUNCTION inventory.i2_legacy_code_exact();

-- Inventory owns the read-only source-to-stock predicate; no Procurement stock SQL.
CREATE FUNCTION inventory.i2_receiving_stock_matches(inst uuid,auth uuid,source_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
 SELECT EXISTS(
 SELECT 1 FROM inventory.inbound_unit_origin o
 JOIN procurement.inbound_received_unit s ON (s.installation_id,s.authority_scope,s.received_unit_id)=(o.installation_id,o.authority_scope,o.received_unit_id)
 JOIN procurement.inbound_arrival a ON (a.installation_id,a.authority_scope,a.arrival_id)=(s.installation_id,s.authority_scope,s.arrival_id)
 JOIN inventory.unit u ON (u.installation_id,u.authority_scope,u.unit_id,u.lot_id)=(o.installation_id,o.authority_scope,o.unit_id,o.lot_id)
 JOIN inventory.ledger l ON (l.installation_id,l.authority_scope,l.effect_id,l.unit_id)=(o.installation_id,o.authority_scope,o.effect_id,o.unit_id)
 WHERE o.installation_id=inst AND o.authority_scope=auth AND o.received_unit_id=source_id
 AND o.arrival_id=s.arrival_id AND o.internal_system_code COLLATE "C"=s.internal_system_code COLLATE "C" AND o.product_number COLLATE "C"=s.product_number COLLATE "C"
 AND o.accepted_unit_weight_kg_text=s.accepted_unit_weight_kg_text AND o.material_type_option_id=s.material_type_option_id AND o.type=s.technical_type AND o.location_id=s.location_id
 AND u.kind=o.type AND u.location_id=o.location_id AND u.customer_scope=''
 AND l.source_fact_id=s.received_unit_id AND l.on_hand_delta=s.accepted_unit_weight_kg_text::numeric AND l.reserved_delta=0
 AND l.command_id='ConfirmPurchaseReceiving' AND l.command_version=1 AND l.actor_role='ACT-WH'
 AND l.issuer=s.issuer AND l.subject=s.subject AND l.request_id=s.request_id AND l.idempotency_key=s.idempotency_key
 AND o.issuer=s.issuer AND o.subject=s.subject AND o.actor_role=s.actor_role AND o.request_id=s.request_id AND o.idempotency_key=s.idempotency_key
 AND a.issuer=s.issuer AND a.subject=s.subject AND a.actor_role=s.actor_role AND a.request_id=s.request_id AND a.idempotency_key=s.idempotency_key
 AND l.binding::jsonb->'effect'->>'type'='STOCK_IN'
 AND l.binding::jsonb->>'command'='ConfirmPurchaseReceiving'
 AND l.binding::jsonb->'version'='1'::jsonb
 AND jsonb_typeof(l.binding::jsonb->'effect'->'kg')='string'
 AND l.binding::jsonb->'effect'->>'kg'=s.accepted_unit_weight_kg_text
 AND l.binding::jsonb->'effect'->'create'->>'lotId'=o.lot_id::text
 AND l.binding::jsonb->'effect'->'create'->>'kind'=o.type
 AND l.binding::jsonb->'effect'->'create'->>'locationId'=o.location_id::text
 AND l.binding::jsonb->'effect'->'create'->>'customerScope'=''
 AND l.binding::jsonb->'effect'->'source'->>'factId'=s.received_unit_id::text
 AND l.binding::jsonb->'effect'->'source'->>'effectId'=o.effect_id::text
 AND l.binding::jsonb->'effect'->>'unitId'=o.unit_id::text
 )
$$;
REVOKE ALL ON FUNCTION inventory.i2_receiving_stock_matches(uuid,uuid,uuid) FROM PUBLIC;
CREATE FUNCTION procurement.i2_arrival_complete() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
 IF (SELECT count(*) FROM procurement.inbound_received_unit s WHERE s.installation_id=NEW.installation_id AND s.authority_scope=NEW.authority_scope AND s.arrival_id=NEW.arrival_id)<>NEW.unit_count
 OR (SELECT count(*) FROM procurement.inbound_waybill w WHERE w.installation_id=NEW.installation_id AND w.authority_scope=NEW.authority_scope AND w.arrival_id=NEW.arrival_id)<>NEW.waybill_count
 OR (SELECT count(*) FROM procurement.inbound_warehouse_receipt r WHERE r.installation_id=NEW.installation_id AND r.authority_scope=NEW.authority_scope AND r.arrival_id=NEW.arrival_id)<>NEW.receipt_count
 OR EXISTS(SELECT 1 FROM procurement.inbound_waybill w WHERE w.installation_id=NEW.installation_id AND w.authority_scope=NEW.authority_scope AND w.arrival_id=NEW.arrival_id AND NOT EXISTS(SELECT 1 FROM procurement.inbound_received_unit s WHERE (s.installation_id,s.authority_scope,s.waybill_id)=(w.installation_id,w.authority_scope,w.waybill_id)))
 OR EXISTS(SELECT 1 FROM procurement.inbound_warehouse_receipt r WHERE r.installation_id=NEW.installation_id AND r.authority_scope=NEW.authority_scope AND r.arrival_id=NEW.arrival_id AND NOT EXISTS(SELECT 1 FROM procurement.inbound_received_unit s WHERE (s.installation_id,s.authority_scope,s.receipt_id)=(r.installation_id,r.authority_scope,r.receipt_id)))
 OR EXISTS(SELECT 1 FROM procurement.inbound_received_unit s WHERE s.installation_id=NEW.installation_id AND s.authority_scope=NEW.authority_scope AND s.arrival_id=NEW.arrival_id AND NOT inventory.i2_receiving_stock_matches(s.installation_id,s.authority_scope,s.received_unit_id)) THEN
  RAISE EXCEPTION 'Receiving requires its complete atomic source and stock bundle' USING ERRCODE='23514',CONSTRAINT='i2_arrival_complete_ck';
 END IF; RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION procurement.i2_arrival_complete() FROM PUBLIC;
CREATE CONSTRAINT TRIGGER i2_arrival_complete_ck AFTER INSERT ON procurement.inbound_arrival DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION procurement.i2_arrival_complete();
CREATE FUNCTION procurement.i2_claim_complete() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
 IF NEW.legacy_receipt_id IS NOT NULL THEN
  IF NOT EXISTS(SELECT 1 FROM procurement.goods_receipt g WHERE g.installation_id=NEW.installation_id AND g.authority_scope=NEW.authority_scope AND g.receipt_id=NEW.legacy_receipt_id AND g.internal_code COLLATE "C"=NEW.raw_code COLLATE "C" AND g.state='POSTED') THEN
   RAISE EXCEPTION 'Physical code claim requires a posted source' USING ERRCODE='23514',CONSTRAINT='i2_claim_complete_ck'; END IF;
 ELSE
  IF NOT EXISTS(SELECT 1 FROM procurement.inbound_received_unit s WHERE s.installation_id=NEW.installation_id AND s.authority_scope=NEW.authority_scope AND s.received_unit_id=NEW.received_unit_id AND s.internal_system_code COLLATE "C"=NEW.raw_code COLLATE "C") THEN
   RAISE EXCEPTION 'Physical code claim requires matching source' USING ERRCODE='23514',CONSTRAINT='i2_claim_complete_ck'; END IF;
 END IF; RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION procurement.i2_claim_complete() FROM PUBLIC;
CREATE CONSTRAINT TRIGGER i2_claim_complete_ck AFTER INSERT ON procurement.inbound_physical_code_claim DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION procurement.i2_claim_complete();
CREATE FUNCTION inventory.i2_origin_complete() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
 IF NOT inventory.i2_receiving_stock_matches(NEW.installation_id,NEW.authority_scope,NEW.received_unit_id) THEN
  RAISE EXCEPTION 'Receiving origin requires its exact stock effect' USING ERRCODE='23514',CONSTRAINT='i2_origin_complete_ck';
 END IF; RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION inventory.i2_origin_complete() FROM PUBLIC;
CREATE CONSTRAINT TRIGGER i2_origin_complete_ck AFTER INSERT ON inventory.inbound_unit_origin DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION inventory.i2_origin_complete();
REVOKE ALL ON procurement.inbound_arrival,procurement.inbound_waybill,procurement.inbound_warehouse_receipt,procurement.inbound_received_unit,procurement.inbound_physical_code_claim,inventory.inbound_unit_origin FROM PUBLIC;
