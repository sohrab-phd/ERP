CREATE TABLE procurement.completed_purchase (
 installation_id uuid NOT NULL,
 authority_scope uuid NOT NULL,
 purchase_id uuid NOT NULL,
 binding text NOT NULL CHECK(octet_length(binding) BETWEEN 1 AND 8192),
 purchase_document_reference text NOT NULL CHECK(octet_length(purchase_document_reference) BETWEEN 1 AND 128 AND btrim(purchase_document_reference)<>''),
 supplier_reference text NOT NULL CHECK(octet_length(supplier_reference) BETWEEN 1 AND 128 AND btrim(supplier_reference)<>''),
 purchase_date date NOT NULL CHECK(purchase_date BETWEEN DATE '0001-01-01' AND DATE '9999-12-31'),
 material_description text NOT NULL CHECK(octet_length(material_description) BETWEEN 1 AND 512 AND btrim(material_description)<>''),
 issuer varchar(256) NOT NULL,
 subject varchar(256) NOT NULL,
 actor_role varchar(32) NOT NULL CHECK(actor_role='ACT-PROC'),
 request_id uuid NOT NULL,
 idempotency_key uuid NOT NULL,
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(installation_id,authority_scope,purchase_id)
);
CREATE TABLE procurement.purchase_proforma_sent (
 installation_id uuid NOT NULL,
 authority_scope uuid NOT NULL,
 proforma_id uuid NOT NULL,
 binding text NOT NULL CHECK(octet_length(binding) BETWEEN 1 AND 8192),
 purchase_id uuid NOT NULL,
 proforma_reference text NOT NULL CHECK(octet_length(proforma_reference) BETWEEN 1 AND 128 AND btrim(proforma_reference)<>''),
 sent_date date NOT NULL CHECK(sent_date BETWEEN DATE '0001-01-01' AND DATE '9999-12-31'),
 issuer varchar(256) NOT NULL,
 subject varchar(256) NOT NULL,
 actor_role varchar(32) NOT NULL CHECK(actor_role='ACT-PROC'),
 request_id uuid NOT NULL,
 idempotency_key uuid NOT NULL,
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(installation_id,authority_scope,proforma_id),
 FOREIGN KEY(installation_id,authority_scope,purchase_id) REFERENCES procurement.completed_purchase(installation_id,authority_scope,purchase_id)
);
