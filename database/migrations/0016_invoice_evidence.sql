CREATE SCHEMA finance;
CREATE TABLE finance.invoice_evidence (
 installation_id uuid NOT NULL,
 authority_scope uuid NOT NULL,
 evidence_id uuid NOT NULL,
 binding text NOT NULL CHECK(octet_length(binding) BETWEEN 1 AND 8192),
 invoice_document_reference text NOT NULL CHECK(octet_length(invoice_document_reference) BETWEEN 1 AND 128 AND btrim(invoice_document_reference)<>'' AND invoice_document_reference !~ '[[:cntrl:]]'),
 issue_date date NOT NULL CHECK(issue_date BETWEEN DATE '0001-01-01' AND DATE '9999-12-31'),
 sales_order_id uuid NOT NULL,
 customer_id uuid NOT NULL,
 issuer varchar(256) NOT NULL,
 subject varchar(256) NOT NULL,
 actor_role varchar(32) NOT NULL CHECK(actor_role='ACT-SALES'),
 request_id uuid NOT NULL,
 idempotency_key uuid NOT NULL,
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(installation_id,authority_scope,evidence_id),
 FOREIGN KEY(installation_id,authority_scope,sales_order_id,customer_id) REFERENCES sales.sales_order(installation_id,authority_scope,order_id,customer_id)
);
