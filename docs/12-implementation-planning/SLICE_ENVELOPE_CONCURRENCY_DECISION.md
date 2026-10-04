# SLICE-ENVELOPE concurrency reconciliation

Status: accepted delegated technical decision, 2026-10-04; canonical-source
reconciliation completed. This is not human baseline approval
or implementation authorization. No source/package/migration is implemented.
The earlier claim-row versus advisory-lock alternatives are withdrawn. This
decision freezes their single shared terminal-only concurrency mechanism.
The binding contract is
[COMMAND_IDEMPOTENCY_SPEC.md](COMMAND_IDEMPOTENCY_SPEC.md) and
[ADR-0011](../00-governance/adrs/ADR-0011-command-idempotency.md).

## One key identity and one physical algorithm

The outcome primary key is (installation_id UUID, authority_scope_id UUID,
idempotency_key UUID v4). A scope is derived by a trusted server adapter, never
accepted from a client's claimed role or scope. The installation ID is stable
configuration, not an invented additional factory tenant/site. Principal ID is
bound in the immutable outcome, not part of uniqueness. Cross-principal reuse
in the same authorized scope therefore conflicts instead of executing again.
All three UUID columns are mandatory, including a database dedicated to one
installation. No scope-only or principal-in-key alternative is permitted.

Use PostgreSQL READ COMMITTED, a single checked-out pg client and a transaction-
scoped advisory lock. No independently committed IN_PROGRESS/claim/lease row,
Redis, distributed lock, background reaper or timeout-based key reuse exists.
After BEGIN, set bounded lock/statement timeouts and acquire
pg_advisory_xact_lock(two signed int32 arguments). Derive those two arguments
from the first eight bytes of SHA-256 over a versioned, length-prefixed UTF-8
encoding of the complete three-part key. Hash collisions merely serialize
unrelated requests; full primary-key and binding comparisons decide identity.
Every caller/retry/worker of this command boundary uses this same namespace.

After acquisition, perform outcome lookup in a SEPARATE SQL statement so READ
COMMITTED obtains a fresh snapshot after waiting. If absent, this transaction
is the executor. If present, check principal plus command ID/version, typed
normalized target identity, resource/authorization scope, material preconditions
and canonical material-payload fingerprint/bytes. The canonicalization version
is itself bound. Retry correlation IDs and transport timestamps are excluded.
Unbounded/unregistered command shapes, duplicate JSON keys, nonfinite numbers,
secrets and invalid identities fail admission before claiming a key.

Canonical payload comparison uses a frozen registration-specific representation,
SHA-256 plus bounded canonical bytes; it does not compare raw JSON key order.
Exact byte equality prevents treating a digest collision as equal payload.
Scope/command/target aliases must be normalized before binding, not guessed
from mutable display labels. Supported old canonicalization/command versions
remain interpretable for retained outcomes; incompatible software refuses replay
without treating an existing key as new.

## Terminal execution, replay and rejection

A matching ACCEPTED outcome returns its bounded saved result with replay
metadata and the original execution/audit reference. A matching REJECTED outcome
returns the same terminal rejection; it does not reevaluate a guard after state
changes. Current authentication, scope access and result-visibility authorization
are checked before revealing either outcome. Historic permissions are not grants.
Production adapters cannot accept a principal or permission claim from the
request body. SLICE-ENVELOPE uses nonbusiness test contexts only; test identity
fixtures are not reachable through production composition.

Any binding mismatch returns nondisclosing GUARD_CONFLICT; preserve the winner,
do not execute, replace its outcome or expose the other principal's result.
Accepted replay is not GUARD_IDEMPOTENT_DUP. Different keys that request the
same immutable business fact remain subject to the future owning module's
natural-key constraints. A positively mapped duplicate-fact guard may return
GUARD_IDEMPOTENT_DUP and persist that new key's REJECTED outcome. Only registered
constraint/guard mappings produce business rejection; an arbitrary SQL error or
incompatible state is not guessed to be a duplicate. The first slice has only
synthetic fixture facts, no real stock/quantity/posting table.

Set a SAVEPOINT before registered handler effects. On a recognized domain/guard
rejection, ROLLBACK TO SAVEPOINT removes every attempted handler effect before
writing the terminal REJECTED outcome and original rejection audit in the same
outer transaction. Constraint exceptions require this rollback before further
SQL. An unmapped error aborts the entire transaction and leaves no outcome.
Accepted handler facts, terminal ACCEPTED outcome and original audit commit
atomically. Audit failure rolls all of them back. Modules still own their facts;
the shared transaction/context never permits arbitrary cross-module SQL writes.

Use an execution UUID generated before handler work. Audit owner inserts one
original execution audit with that ID, then outcome links to it through a foreign
key. An original audit row is not recreated on replay. A replay/conflict attempt
has a separate attributable, redacted audit referencing the original where
visibility permits; it is committed before reporting the response. Failure of
that attempt audit returns a transient infrastructure error, preserving the
original terminal outcome. Commit uncertainty on replay audit can yield repeated
attempt records; this never duplicates original execution facts/audit. Future
domain-specific security audit policy is reconciled at the identity slice.

A lock timeout, deadlock, serialization error, connection loss, audit outage or
unknown COMMIT result is not a durable business REJECTED outcome. Roll back when
possible and return a transient/uncertain result. After uncertain COMMIT, retry
resolution with the SAME key/binding through this boundary against the primary
database. Never issue a new key or fallback posting. Primary unavailability
preserves uncertainty. A database unique constraint on the full key remains the
last defence against a nonconforming writer; its transaction must roll back
before resolving the winning outcome.

Classify PostgreSQL 40P01, 40001, lock/statement timeout and connection-class
failures before registered constraint-to-business mappings. A savepoint never
turns those technical failures into a terminal business rejection.

## Crash windows and retention

Before COMMIT, process loss/rollback removes handler effects, audit and outcome;
the transaction-scoped lock is released. Retrying the same key can execute once.
After COMMIT and before delivery, a retry finds and replays the outcome. A handler
may not commit, emit an external business effect or independently submit posting
before the outer transaction completes. External effects need a future outbox
boundary; no external messaging infrastructure is introduced in this slice.

Retain terminal outcomes and binding/deduplication evidence for the installation
lifetime; no automatic key expiry/deletion/reuse in the foundation. No retention
number is invented from OQ-016. Future compaction must preserve permanent binding
and outcome tombstones and prove delayed retries cannot reexecute; result/audit
privacy and retention changes need an explicit impact decision. Backups/restores
must preserve fact/outcome/original-audit consistency. A consistent point-in-time
restore alone does not prove all previously acknowledged outcomes survived.
After restore, command admission stays disabled until recovery proves complete
acknowledged-history preservation, or a reviewed recovery procedure fences the
entire pre-recovery request generation and reconciles uncertain commands. Old
requests retain their original generation/binding and cannot be silently reissued
as fresh commands. Retained outcomes may support authorized read-only recovery;
absence in a lossy restore is not proof of nonexecution. No permanent exactly-once
guarantee is claimed across unreconciled database loss. The restore acceptance
case must deliberately omit an acknowledged outcome and prove automatic same-key
reexecution is refused. A future recovery rollout must define its durable fence
before enabling post-restore writes; the backup product/RPO operations remain a
later recovery/cutover prerequisite, not an invented zero-loss business rule.
Privacy-sensitive payloads need a minimized binding before their later slice.

## Required first-slice proof

Acceptance must demonstrate matching accepted/rejected replay; canonical payload
reordering; every key-binding mismatch including another authorized principal;
no disclosure after revocation; different-key fixture duplicate facts; same-key
parallel accept/reject/mismatch races; savepoint cleanup after rejection/constraint
failure; audit atomicity; real PostgreSQL lock timeout/deadlock/rollback; crash
before commit; lost response after commit; uncertain commit lookup and outage;
no key expiry/reuse; retained-version interpretation; restored consistency; and
production composition excludes all test identities/fixture command handlers.
These are implementation acceptance tests planned, not tests executed now.

Canonical TRANSACTION_AND_IDEMPOTENCY, API_ENVELOPE, EVENT_AND_REJECTION,
AUDIT_TAXONOMY, ORCHESTRATION, identity/security, testing and module ownership
were read on 2026-10-04 after hook retirement. Live descriptions now point to
one bound tuple, terminal-only algorithm and atomic decision/audit contract.
No OQ answer/status is changed. No OS containment test is required.

Freeze details: COMMAND_KEY_LOCK_V1 ASCII prefix plus three canonical UUIDs,
each length-prefixed with unsigned 4-byte big-endian UTF-8 byte length; SHA-256
first eight bytes as two signed big-endian int32s. Lock timeout 5s, statement
timeout 15s, overall request deadline 30s; explicit retry/uncertain responses,
no hidden automatic retry loop. The authority principal is issuer+subject.
Original audit is inserted first and outcome links to it, avoiding circular FKs.
No unique claim row or deferred incomplete-outcome constraint is needed.
