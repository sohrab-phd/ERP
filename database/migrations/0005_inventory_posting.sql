CREATE SCHEMA inventory;
CREATE TABLE inventory.unit (
 installation_id uuid NOT NULL,
 authority_scope uuid NOT NULL,
 unit_id uuid NOT NULL,
 lot_id uuid NOT NULL,
 kind varchar(128) NOT NULL CHECK(octet_length(kind) BETWEEN 1 AND 128),
 location_id uuid NOT NULL,
 customer_scope varchar(256) NOT NULL DEFAULT '' CHECK(octet_length(customer_scope)<=256),
 state varchar(32) NOT NULL CHECK(state IN ('AVAILABLE','RESERVED','ISSUED_TO_PRODUCTION','PARTIALLY_CONSUMED','CONSUMED','PACKED','SHIPPED','SCRAPPED','RETURNED','CLOSED')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(installation_id,authority_scope,unit_id)
);
CREATE TABLE inventory.ledger (
 installation_id uuid NOT NULL,
 authority_scope uuid NOT NULL,
 ledger_id uuid NOT NULL,
 unit_id uuid NOT NULL,
 source_fact_id uuid NOT NULL,
 effect_id uuid NOT NULL,
 binding text NOT NULL CHECK(octet_length(binding) BETWEEN 1 AND 8192),
 on_hand_delta numeric NOT NULL CHECK(scale(on_hand_delta)<=18 AND abs(on_hand_delta)<100000000000000000000),
 reserved_delta numeric NOT NULL CHECK(scale(reserved_delta)<=18 AND abs(reserved_delta)<100000000000000000000),
 original_ledger_id uuid,
 executor varchar(16) NOT NULL DEFAULT 'ACT-IPS' CHECK(executor='ACT-IPS'),
 issuer varchar(256) NOT NULL,
 subject varchar(256) NOT NULL,
 actor_role varchar(32) NOT NULL,
 request_id uuid NOT NULL,
 command_id varchar(128) NOT NULL,
 command_version integer NOT NULL CHECK(command_version>0),
 idempotency_key uuid NOT NULL,
 occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(installation_id,authority_scope,ledger_id),
 UNIQUE(installation_id,authority_scope,effect_id),
 UNIQUE(installation_id,authority_scope,unit_id,ledger_id),
 FOREIGN KEY(installation_id,authority_scope,unit_id) REFERENCES inventory.unit(installation_id,authority_scope,unit_id),
 FOREIGN KEY(installation_id,authority_scope,unit_id,original_ledger_id) REFERENCES inventory.ledger(installation_id,authority_scope,unit_id,ledger_id),
 CHECK(on_hand_delta<>0 OR reserved_delta<>0)
);
CREATE INDEX inventory_ledger_unit ON inventory.ledger(installation_id,authority_scope,unit_id);
CREATE TABLE inventory.balance (
 installation_id uuid NOT NULL,
 authority_scope uuid NOT NULL,
 unit_id uuid NOT NULL,
 on_hand numeric NOT NULL CHECK(on_hand>=0 AND scale(on_hand)<=18 AND on_hand<100000000000000000000),
 reserved numeric NOT NULL CHECK(reserved>=0 AND scale(reserved)<=18 AND reserved<=on_hand),
 PRIMARY KEY(installation_id,authority_scope,unit_id),
 FOREIGN KEY(installation_id,authority_scope,unit_id) REFERENCES inventory.unit(installation_id,authority_scope,unit_id)
);
CREATE TABLE inventory.reservation (
 installation_id uuid NOT NULL,
 authority_scope uuid NOT NULL,
 reservation_id uuid NOT NULL,
 unit_id uuid NOT NULL,
 demand_id uuid NOT NULL,
 kg numeric NOT NULL CHECK(kg>0 AND scale(kg)<=18 AND kg<100000000000000000000),
 state varchar(16) NOT NULL CHECK(state IN ('ACTIVE','RELEASED','CONSUMED')),
 PRIMARY KEY(installation_id,authority_scope,reservation_id),
 FOREIGN KEY(installation_id,authority_scope,unit_id) REFERENCES inventory.unit(installation_id,authority_scope,unit_id)
);
CREATE UNIQUE INDEX inventory_one_active_claim ON inventory.reservation(installation_id,authority_scope,unit_id) WHERE state='ACTIVE';
