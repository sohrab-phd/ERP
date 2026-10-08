CREATE SCHEMA procurement;
CREATE TABLE procurement.goods_receipt (
 installation_id uuid NOT NULL,
 authority_scope uuid NOT NULL,
 receipt_id uuid NOT NULL,
 binding text NOT NULL CHECK(octet_length(binding) BETWEEN 1 AND 8192),
 state varchar(16) NOT NULL CHECK(state IN ('DRAFT','RECEIVED','POSTED')),
 internal_code varchar(128) NOT NULL CHECK(octet_length(internal_code) BETWEEN 1 AND 128),
 count numeric NOT NULL CHECK(count>=0 AND scale(count)=0 AND count<100000000000000000000),
 measured_kg numeric NOT NULL CHECK(measured_kg>0 AND scale(measured_kg)=0 AND measured_kg<100000000000000000000),
 type varchar(16) NOT NULL CHECK(type IN ('COIL','SHEET','ANGLE','BEAM','OTHER')),
 location_id uuid NOT NULL,
 product_code varchar(128) CHECK(octet_length(product_code) BETWEEN 1 AND 128),
 lot_id uuid,
 unit_id uuid,
 material_id uuid,
 effect_id uuid,
 issuer varchar(256) NOT NULL,
 subject varchar(256) NOT NULL,
 actor_role varchar(32) NOT NULL CHECK(actor_role='ACT-WH'),
 request_id uuid NOT NULL,
 idempotency_key uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(installation_id,authority_scope,receipt_id),
 CHECK(type<>'SHEET' OR product_code IS NOT NULL),
 CHECK((state='POSTED' AND lot_id IS NOT NULL AND unit_id IS NOT NULL AND material_id IS NOT NULL AND effect_id IS NOT NULL)
    OR (state<>'POSTED' AND lot_id IS NULL AND unit_id IS NULL AND material_id IS NULL AND effect_id IS NULL))
);
ALTER TABLE inventory.unit ADD UNIQUE(installation_id,authority_scope,unit_id,lot_id);
CREATE TABLE inventory.material_lot (
 installation_id uuid NOT NULL,
 authority_scope uuid NOT NULL,
 lot_id uuid NOT NULL,
 receipt_id uuid NOT NULL,
 unit_id uuid NOT NULL,
 material_id uuid NOT NULL,
 effect_id uuid NOT NULL,
 internal_code varchar(128) NOT NULL CHECK(octet_length(internal_code) BETWEEN 1 AND 128),
 count numeric NOT NULL CHECK(count>=0 AND scale(count)=0 AND count<100000000000000000000),
 measured_kg numeric NOT NULL CHECK(measured_kg>0 AND scale(measured_kg)=0 AND measured_kg<100000000000000000000),
 type varchar(16) NOT NULL CHECK(type IN ('COIL','SHEET','ANGLE','BEAM','OTHER')),
 location_id uuid NOT NULL,
 product_code varchar(128) CHECK(octet_length(product_code) BETWEEN 1 AND 128),
 PRIMARY KEY(installation_id,authority_scope,lot_id),
 UNIQUE(installation_id,authority_scope,receipt_id),
 UNIQUE(installation_id,authority_scope,unit_id),
 UNIQUE(installation_id,authority_scope,material_id),
 UNIQUE(installation_id,authority_scope,effect_id),
 FOREIGN KEY(installation_id,authority_scope,receipt_id) REFERENCES procurement.goods_receipt(installation_id,authority_scope,receipt_id),
 FOREIGN KEY(installation_id,authority_scope,unit_id,lot_id) REFERENCES inventory.unit(installation_id,authority_scope,unit_id,lot_id),
 CHECK(type<>'SHEET' OR product_code IS NOT NULL)
);
CREATE UNIQUE INDEX inventory_sheet_product_code ON inventory.material_lot(installation_id,authority_scope,product_code) WHERE type='SHEET';
