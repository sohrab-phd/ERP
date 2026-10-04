CREATE TABLE kernel.audit_event (
    event_id uuid PRIMARY KEY CHECK (event_id <> '00000000-0000-0000-0000-000000000000'),
    execution_id uuid CHECK (execution_id <> '00000000-0000-0000-0000-000000000000'),
    event_kind text NOT NULL CHECK (event_kind IN (
        'AUD-CMD-ACCEPTED', 'AUD-CMD-REJECTED', 'AUD-CMD-REPLAYED',
        'AUD-CMD-CONFLICT', 'AUD-CMD-ADMISSION-DENIED', 'AUD-AUTHN-FAIL',
        'AUD-ACTOR-TEMP', 'AUD-ISOLATION-DENY', 'AUD-SOD', 'AUD-REVERSAL', 'AUD-OPEN-POLICY'
    )),
    installation_id uuid NOT NULL CHECK (installation_id <> '00000000-0000-0000-0000-000000000000'),
    authority_scope_id uuid CHECK (authority_scope_id <> '00000000-0000-0000-0000-000000000000'),
    idempotency_key uuid CHECK (idempotency_key::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
    principal_issuer text CHECK (octet_length(principal_issuer) BETWEEN 1 AND 256),
    principal_subject text CHECK (octet_length(principal_subject) BETWEEN 1 AND 256),
    actor_role text CHECK (octet_length(actor_role) BETWEEN 1 AND 128),
    command text CHECK (octet_length(command) BETWEEN 1 AND 128),
    command_version integer CHECK (command_version > 0),
    request_id uuid NOT NULL CHECK (request_id <> '00000000-0000-0000-0000-000000000000'),
    occurred_at timestamptz NOT NULL,
    family text CHECK (family IN ('GUARD_OPEN_POLICY', 'GUARD_INVARIANT', 'GUARD_ACTOR',
        'GUARD_STATE', 'GUARD_IDEMPOTENT_DUP', 'GUARD_CONFLICT', 'GUARD_PORTAL_MVP')),
    open_item text,
    fact_identity text,
    source_state text,
    target_state text,
    customer_scope text,
    safe_details jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(safe_details) = 'object' AND octet_length(safe_details::text) <= 4096),
    CHECK ((principal_issuer IS NULL) = (principal_subject IS NULL)),
    CHECK (event_kind NOT IN ('AUD-CMD-ACCEPTED', 'AUD-CMD-REJECTED', 'AUD-CMD-REPLAYED', 'AUD-CMD-CONFLICT', 'AUD-SOD', 'AUD-REVERSAL', 'AUD-OPEN-POLICY') OR
        (authority_scope_id IS NOT NULL AND idempotency_key IS NOT NULL
         AND principal_issuer IS NOT NULL AND principal_subject IS NOT NULL AND actor_role IS NOT NULL
         AND command IS NOT NULL AND command_version IS NOT NULL)),
    CHECK (event_kind NOT IN ('AUD-CMD-ACCEPTED', 'AUD-CMD-REJECTED', 'AUD-CMD-REPLAYED', 'AUD-SOD', 'AUD-REVERSAL', 'AUD-OPEN-POLICY') OR execution_id IS NOT NULL),
    CHECK (event_kind <> 'AUD-CMD-ACCEPTED' OR family IS NULL),
    CHECK (event_kind <> 'AUD-CMD-REJECTED' OR family IS NOT NULL),
    CHECK (event_kind <> 'AUD-OPEN-POLICY' OR (family = 'GUARD_OPEN_POLICY') IS TRUE),
    CHECK ((family = 'GUARD_OPEN_POLICY' AND open_item IS NOT NULL AND length(open_item) > 0) OR
           (family IS DISTINCT FROM 'GUARD_OPEN_POLICY' AND open_item IS NULL)),
    UNIQUE (event_id, execution_id, installation_id, authority_scope_id, idempotency_key,
            principal_issuer, principal_subject, event_kind)
);

CREATE UNIQUE INDEX audit_one_original_decision ON kernel.audit_event (execution_id)
    WHERE event_kind IN ('AUD-CMD-ACCEPTED', 'AUD-CMD-REJECTED');
