CREATE TABLE kernel.command_outcome (
    installation_id uuid NOT NULL CHECK (installation_id <> '00000000-0000-0000-0000-000000000000'),
    authority_scope_id uuid NOT NULL CHECK (authority_scope_id <> '00000000-0000-0000-0000-000000000000'),
    idempotency_key uuid NOT NULL CHECK (idempotency_key::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
    execution_id uuid UNIQUE NOT NULL CHECK (execution_id <> '00000000-0000-0000-0000-000000000000'),
    principal_issuer text NOT NULL CHECK (octet_length(principal_issuer) BETWEEN 1 AND 256),
    principal_subject text NOT NULL CHECK (octet_length(principal_subject) BETWEEN 1 AND 256),
    command text NOT NULL CHECK (octet_length(command) BETWEEN 1 AND 128),
    command_version integer NOT NULL CHECK (command_version > 0),
    target_kind text NOT NULL CHECK (octet_length(target_kind) BETWEEN 1 AND 64),
    target_id text NOT NULL CHECK (octet_length(target_id) BETWEEN 1 AND 256),
    canonicalization_version integer NOT NULL CHECK (canonicalization_version > 0),
    canonical_bytes bytea NOT NULL CHECK (octet_length(canonical_bytes) BETWEEN 1 AND 262144),
    payload_sha256 char(64) NOT NULL CHECK (payload_sha256 ~ '^[0-9a-f]{64}$'),
    result_schema_version integer NOT NULL CHECK (result_schema_version > 0),
    outcome_kind text NOT NULL CHECK (outcome_kind IN ('ACCEPTED', 'REJECTED')),
    family text CHECK (family IN ('GUARD_STATE', 'GUARD_INVARIANT', 'GUARD_CONFLICT',
        'GUARD_IDEMPOTENT_DUP', 'GUARD_ACTOR', 'GUARD_PORTAL_MVP', 'GUARD_OPEN_POLICY')),
    open_item text,
    result jsonb NOT NULL CHECK (jsonb_typeof(result) = 'object' AND octet_length(result::text) <= 262144),
    decision_audit_kind text NOT NULL,
    first_request_id uuid NOT NULL CHECK (first_request_id <> '00000000-0000-0000-0000-000000000000'),
    completed_at timestamptz NOT NULL,
    original_audit_id uuid UNIQUE NOT NULL,
    PRIMARY KEY (installation_id, authority_scope_id, idempotency_key),
    CHECK ((outcome_kind = 'ACCEPTED' AND family IS NULL AND decision_audit_kind = 'AUD-CMD-ACCEPTED') OR
           (outcome_kind = 'REJECTED' AND family IS NOT NULL AND decision_audit_kind = 'AUD-CMD-REJECTED')),
    CHECK ((family = 'GUARD_OPEN_POLICY' AND open_item IS NOT NULL AND length(open_item) > 0) OR
           (family IS DISTINCT FROM 'GUARD_OPEN_POLICY' AND open_item IS NULL)),
    CHECK ((result->>'outcome' = lower(outcome_kind) AND result->>'command' = command
           AND result->>'idempotency_key' = idempotency_key::text) IS TRUE),
    CHECK ((outcome_kind = 'ACCEPTED' AND NOT result ? 'family') OR
           (outcome_kind = 'REJECTED' AND (result->>'family' = family) IS TRUE)),
    FOREIGN KEY (original_audit_id, execution_id, installation_id, authority_scope_id,
                 idempotency_key, principal_issuer, principal_subject, decision_audit_kind)
        REFERENCES kernel.audit_event (event_id, execution_id, installation_id, authority_scope_id,
                 idempotency_key, principal_issuer, principal_subject, event_kind)
);
