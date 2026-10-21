-- I1 immutable Procurement sources; no stock or documentary-purchase side effects.
-- Frozen PO-REF-R1-A-v1: only U+0020 boundary trim and the 48 approved mappings.
CREATE FUNCTION procurement.po_reference_key_r1_v1(raw text) RETURNS text
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE SECURITY INVOKER
SET search_path=pg_catalog
AS $$ SELECT pg_catalog.translate(pg_catalog.btrim(raw,pg_catalog.chr(32)),
'ABCDEFGHIJKLMNOPQRSTUVWXYZ۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩يك',
'abcdefghijklmnopqrstuvwxyz01234567890123456789یک') COLLATE "C" $$;
REVOKE ALL ON FUNCTION procurement.po_reference_key_r1_v1(text) FROM PUBLIC;

CREATE TABLE procurement.inbound_catalogue_option (
 installation_id uuid NOT NULL,
 authority_scope uuid NOT NULL CHECK(authority_scope=installation_id),
 option_id uuid NOT NULL,
 catalogue_kind text COLLATE "C" NOT NULL CHECK(catalogue_kind IN('MATERIAL_TYPE','QUALITY_GRADE','COLOR')),
 label text COLLATE "C" NOT NULL CHECK(char_length(label) BETWEEN 1 AND 128 AND octet_length(label)<=512 AND label !~ U&'[\0001-\001F\007F-\009F]' AND translate(label,U&'\0009\000A\000B\000C\000D \00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF','')<>''),
 binding text NOT NULL CHECK(octet_length(binding) BETWEEN 1 AND 262144),
 issuer text NOT NULL CHECK(octet_length(issuer) BETWEEN 1 AND 256),
 subject text NOT NULL CHECK(octet_length(subject) BETWEEN 1 AND 256),
 actor_role text NOT NULL CHECK(actor_role IN('ACT-PROC','ACT-WH')),
 request_id uuid NOT NULL,
 idempotency_key uuid NOT NULL,
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CONSTRAINT i1_option_pk PRIMARY KEY(installation_id,authority_scope,option_id),
 CONSTRAINT i1_option_label_uq UNIQUE(installation_id,catalogue_kind,label),
 CONSTRAINT i1_option_kind_id_uq UNIQUE(installation_id,authority_scope,catalogue_kind,option_id)
);
CREATE INDEX i1_option_page_idx ON procurement.inbound_catalogue_option(installation_id,authority_scope,catalogue_kind,option_id);

CREATE TABLE procurement.operational_purchase_order (
 installation_id uuid NOT NULL,
 authority_scope uuid NOT NULL CHECK(authority_scope=installation_id),
 order_id uuid NOT NULL,
 order_reference text COLLATE "C" NOT NULL CHECK(char_length(order_reference) BETWEEN 1 AND 128 AND octet_length(order_reference)<=512 AND order_reference !~ U&'[\0001-\001F\007F-\009F]' AND translate(order_reference,U&'\0009\000A\000B\000C\000D \00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF','')<>''),
 order_reference_key text COLLATE "C" GENERATED ALWAYS AS (procurement.po_reference_key_r1_v1(order_reference)) STORED NOT NULL CHECK(char_length(order_reference_key) BETWEEN 1 AND 128 AND octet_length(order_reference_key)<=512),
 reference_key_profile text NOT NULL DEFAULT 'PO-REF-R1-A-v1' CHECK(reference_key_profile='PO-REF-R1-A-v1'),
 registration_jy smallint NOT NULL,
 registration_jm smallint NOT NULL,
 registration_jd smallint NOT NULL,
 calendar_profile text NOT NULL DEFAULT 'UT-JALALI-1206-1498-v1' CHECK(calendar_profile='UT-JALALI-1206-1498-v1'),
 line_count integer NOT NULL CHECK(line_count BETWEEN 1 AND 128),
 binding text NOT NULL CHECK(octet_length(binding) BETWEEN 1 AND 262144),
 issuer text NOT NULL CHECK(octet_length(issuer) BETWEEN 1 AND 256),
 subject text NOT NULL CHECK(octet_length(subject) BETWEEN 1 AND 256),
 actor_role text NOT NULL CHECK(actor_role='ACT-PROC'),
 request_id uuid NOT NULL,
 idempotency_key uuid NOT NULL,
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CONSTRAINT i1_po_pk PRIMARY KEY(installation_id,authority_scope,order_id),
 CONSTRAINT i1_po_reference_uq UNIQUE(installation_id,order_reference_key),
 CONSTRAINT i1_po_count_uq UNIQUE(installation_id,authority_scope,order_id,line_count),
 CONSTRAINT i1_po_jalali_ck CHECK(registration_jy BETWEEN 1206 AND 1498 AND registration_jm BETWEEN 1 AND 12 AND registration_jd>=1 AND registration_jd<=CASE WHEN registration_jm<=6 THEN 31 WHEN registration_jm<=11 THEN 30 WHEN registration_jy IN(1210,1214,1218,1222,1226,1230,1234,1238,1243,1247,1251,1255,1259,1263,1267,1271,1276,1280,1284,1288,1292,1296,1300,1304,1309,1313,1317,1321,1325,1329,1333,1337,1342,1346,1350,1354,1358,1362,1366,1370,1375,1379,1383,1387,1391,1395,1399,1403,1408,1412,1416,1420,1424,1428,1432,1436,1441,1445,1449,1453,1457,1461,1465,1469,1474,1478,1482,1486,1490,1494,1498) THEN 30 ELSE 29 END)
);

CREATE TABLE procurement.operational_purchase_order_line (
 installation_id uuid NOT NULL,
 authority_scope uuid NOT NULL CHECK(authority_scope=installation_id),
 order_id uuid NOT NULL,
 line_id uuid NOT NULL,
 declared_line_count integer NOT NULL CHECK(declared_line_count BETWEEN 1 AND 128),
 position integer NOT NULL CHECK(position BETWEEN 1 AND declared_line_count),
 item_number text COLLATE "C" CHECK(item_number IS NULL OR (char_length(item_number) BETWEEN 1 AND 128 AND octet_length(item_number)<=512 AND item_number !~ U&'[\0001-\001F\007F-\009F]' AND translate(item_number,U&'\0009\000A\000B\000C\000D \00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF','')<>'')),
 material_type_option_id uuid NOT NULL,
 material_type_kind text NOT NULL DEFAULT 'MATERIAL_TYPE' CHECK(material_type_kind='MATERIAL_TYPE'),
 color_option_id uuid,
 color_kind text NOT NULL DEFAULT 'COLOR' CHECK(color_kind='COLOR'),
 quality_grade_option_id uuid,
 quality_grade_kind text NOT NULL DEFAULT 'QUALITY_GRADE' CHECK(quality_grade_kind='QUALITY_GRADE'),
 ral_color_number text COLLATE "C" CHECK(ral_color_number IS NULL OR (char_length(ral_color_number) BETWEEN 1 AND 128 AND octet_length(ral_color_number)<=512 AND ral_color_number !~ U&'[\0001-\001F\007F-\009F]' AND translate(ral_color_number,U&'\0009\000A\000B\000C\000D \00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF','')<>'')),
 width_m_text text COLLATE "C" NOT NULL CHECK(CASE WHEN char_length(width_m_text)<=39 AND width_m_text ~ '^(0|[1-9][0-9]{0,19})([.][0-9]{1,18})?$' THEN width_m_text::numeric>0 AND width_m_text::numeric<100000000000000000000 ELSE false END),
 thickness_mm_text text COLLATE "C" NOT NULL CHECK(CASE WHEN char_length(thickness_mm_text)<=39 AND thickness_mm_text ~ '^(0|[1-9][0-9]{0,19})([.][0-9]{1,18})?$' THEN thickness_mm_text::numeric>0 AND thickness_mm_text::numeric<100000000000000000000 ELSE false END),
 length_m_text text COLLATE "C" CHECK(length_m_text IS NULL OR (CASE WHEN char_length(length_m_text)<=39 AND length_m_text ~ '^(0|[1-9][0-9]{0,19})([.][0-9]{1,18})?$' THEN length_m_text::numeric>0 AND length_m_text::numeric<100000000000000000000 ELSE false END)),
 unit_weight_kg_text text COLLATE "C" NOT NULL CHECK(unit_weight_kg_text ~ '^[1-9][0-9]{0,19}$'),
 ordered_unit_count_text text COLLATE "C" NOT NULL CHECK(ordered_unit_count_text ~ '^[1-9][0-9]{0,19}$'),
 CONSTRAINT i1_line_pk PRIMARY KEY(installation_id,authority_scope,line_id),
 CONSTRAINT i1_line_position_uq UNIQUE(installation_id,authority_scope,order_id,position),
 CONSTRAINT i1_line_order_identity_uq UNIQUE(installation_id,authority_scope,order_id,line_id),
 CONSTRAINT i1_line_parent_count_fk FOREIGN KEY(installation_id,authority_scope,order_id,declared_line_count) REFERENCES procurement.operational_purchase_order(installation_id,authority_scope,order_id,line_count),
 CONSTRAINT i1_line_material_fk FOREIGN KEY(installation_id,authority_scope,material_type_kind,material_type_option_id) REFERENCES procurement.inbound_catalogue_option(installation_id,authority_scope,catalogue_kind,option_id),
 CONSTRAINT i1_line_color_fk FOREIGN KEY(installation_id,authority_scope,color_kind,color_option_id) REFERENCES procurement.inbound_catalogue_option(installation_id,authority_scope,catalogue_kind,option_id),
 CONSTRAINT i1_line_quality_fk FOREIGN KEY(installation_id,authority_scope,quality_grade_kind,quality_grade_option_id) REFERENCES procurement.inbound_catalogue_option(installation_id,authority_scope,catalogue_kind,option_id)
);

-- N unique positions within1..N plus this deferred count close the original array.
-- This invoker-rights guard only reads; application/envelope retain transaction ownership.
CREATE FUNCTION procurement.i1_order_complete() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
 IF (SELECT count(*) FROM procurement.operational_purchase_order_line l
     WHERE l.installation_id=NEW.installation_id AND l.authority_scope=NEW.authority_scope AND l.order_id=NEW.order_id)<>NEW.line_count THEN
  RAISE EXCEPTION 'Operational order requires its complete original line set'
   USING ERRCODE='23514',CONSTRAINT='i1_po_complete_ck';
 END IF;
 RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION procurement.i1_order_complete() FROM PUBLIC;
CREATE CONSTRAINT TRIGGER i1_po_complete_ck AFTER INSERT ON procurement.operational_purchase_order
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION procurement.i1_order_complete();
REVOKE ALL ON procurement.inbound_catalogue_option,procurement.operational_purchase_order,procurement.operational_purchase_order_line FROM PUBLIC;
