---
id: PLAN-COMMAND-IDEMPOTENCY-001
title: Binding generic durable command outcomes and replay specification
phase: 12-implementation-planning
status: accepted
version: 1.0.0
owners: [chief-solution-architect]
depends_on: [ADR-0011, ADR-0006, ADR-0007, DATA-TX-001, APP-ENV-001, SEC-AUD-001]
last_reviewed: 2026-10-04
approval: null
supersedes: null
---

# Generic durable command outcomes and replay

Binding delegated technical decision under ADR-0012, recorded in
[ADR-0011](../00-governance/adrs/ADR-0011-command-idempotency.md). Accepted technical
design directs future implementation; it is not human baseline approval or
implementation authorization. No product code/database is created.

Canonical sources reviewed on 2026-10-04: live decision/OQ registers, module
ownership, DATA-TX-001, posting kernel, logical model/attributes, command catalogue,
API/orchestration, transition/concurrency/rejection catalogues, identity, RBAC,
customer isolation, audit, threats, security verification, testing/property
intents and recovery. Their generic descriptions are reconciled here and in live
contracts. Historical APR/CHK snapshots retain original text. Factory/OQ answers
and statuses remain unchanged; ACT-IPS is the sole quantity writer and owner
boundaries/Production atomic bundles remain intact.

## Scope and ownership

Every admitted state-changing command uses this PostgreSQL protocol.
SLICE-ENVELOPE exercises it with nonbusiness test fixtures only: production host
exposes health, no command routes or fixture identities. Production identity/RBAC
and domain permission mappings precede later business slices.
Kernel owns outcomes/audit infrastructure. Each domain owner participates through
its public transaction contract; shared connection does not permit cross-module
SQL. Handlers cannot commit, open independent write transactions or retain
transaction-bound work after return.

The first committed terminal ACCEPTED or REJECTED binds one intent permanently.
Matching retries return it without execution or guard reevaluation. Technical
failure without terminal commit is not a durable business rejection.

## Namespace and bound identity

Unique tuple: (installation_id UUID, authority_scope_id UUID, idempotency_key UUID).
Installation and organizational scope are stable server configuration/verified
context; one legal entity/principal site initially (answered OQ-013). No new
multi-tenant/site model. Customer visibility is independently checked; client
customer/role claims cannot select another namespace.

Caller key is valid RFC-variant UUID v4, canonical lowercase text, not a credential
or business fact number. Command/principal/target are bound content, NOT uniqueness
components. Bind these immutable fields:

| Field | Binding |
| --- | --- |
| Principal | Trusted case-sensitive immutable issuer + subject; never display name, Station, worker/session ID or request actor |
| Scope | Complete installation/organizational authority tuple and effect-bearing customer/resource identities |
| Command | Exact catalogue ID plus positive int32 contract version |
| Target | Typed canonical resource identity or explicit client create-intent UUID; no ambiguous null |
| Preconditions | Every effect-bearing expected version/optimistic condition |
| Material payload | Every admitted effect-bearing field; preserve absence/null and array order |
| Canonicalization | Stored version, exact canonical bytes and SHA-256, all compared |

Request field is `contract_version` (APP-ENV-001); persistence `command_version`
stores that same value. They are an explicit transport-to-column mapping, not
two independent version identities.

Another principal using the same scoped key conflicts, without second execution
or foreign outcome disclosure. Another authorized scope has a distinct namespace,
but business uniqueness still applies across keys/scopes. Workers retry with
original initiating principal/key plus separately verified/audited delegation;
worker identity is not a second SoD human. Later required second-human evidence
is trusted, validated and materially bound, never a body role assertion.

## Frozen admission and canonicalization

Technical limits, not factory quantities: UTF-8 request body 256 KiB; depth 32
(root=1); 10,000 total object members plus array elements; each string 64 KiB
UTF-8; canonical binding bytes and saved semantic response each 256 KiB.
Issuer/subject each <=256 UTF-8 bytes, command ID <=128, target kind <=64,
target ID <=256; identity fields nonempty.

COMMAND_CANONICAL_V1 admits bounded registered JSON objects. Parser detects
duplicate object names at every level, unpaired surrogates, unsupported encodings,
invalid lexical numbers and unknown envelope/payload or credential/secret fields
BEFORE key acquisition. Registered allowed names/shapes prevent storing arbitrary
unknown fields as a rejection or silently dropping them. Known bindable material
fields can fail required/property/domain validation after admission and produce
durable semantic rejection; malformed/unbounded/unbindable input consumes no key.

Object names sort by unsigned UTF-8 bytes; arrays preserve order. Exact Unicode
scalars remain unchanged, no locale sort/normalization/trimming. Quote/backslash
use JSON escapes; controls U+0000–001F use lowercase six-character JSON escapes;
other scalars use literal UTF-8. Colon/comma without whitespace. Numeric tokens
are integral base-10 without fraction/exponent syntax and within safe-integer
range, checked lexically BEFORE conversion; -0 normalizes to 0. Future factory
decimal quantity/money is canonical decimal STRING under its owning schema, never
binary floating-point JSON arithmetic. No factory scale is decided here.

Canonical input includes command/version, typed target, material preconditions
and payload; principal/scope are separately compared row bindings. Exclude
transport attempt/trace IDs, arrival time, connection data and auth headers.
Store exact canonical bytes with SHA-256; compare both, including forced hash
collisions. Binding/result fields are minimized and access-restricted; they are
not logged. Credentials are rejected, not retained for hashing.

Existing rows are interpreted using their stored canonicalizer and requested
contract version before new effect defaults. Retain version readers while rows
exist; changed requested contract conflicts. Unknown stored versions cause
nonexecuting technical incompatibility, never key recycling or fresh execution.

Registry distinguishes active execution contracts from retained replay-only
decoders. A retired but readable contract may resolve an existing outcome under
current permissions; an absent key for that retired contract is refused before
handler execution. Retaining an outcome reader does not retain authority to start
new executions under obsolete semantics. Initial synthetic contract/profile is
version 1; compatibility tests simulate this upgrade boundary.

## Access and authorization decision point

Authenticate/derive trusted principal and scope before lookup. Check current
command permission, target/customer visibility and temporary-actor restrictions
before claiming/disclosing any key. Reevaluate the permission port after key-lock
wait, immediately before execution or replay disclosure. This is the authorization
linearization point: revocation committed before it denies; later revocation
governs later attempts, not retroactive instantaneous cancellation.

Creation replay also checks current access to its stored resulting resource.
Principal mismatch never discloses stored target/principal/result. Revoked or
invisible request is a current denial preserving original outcome.
Body roles/principals/scope are never authority. First-slice controlled context
and permission ports exist only in the test harness, absent production composition.

Unknown command/version, malformed/unbounded input, invalid key/target,
unauthenticated or inaccessible request is admission failure: no outcome/key
consumption. Safe security audit uses a separate transaction; failure to persist
it is technical failure, never a falsely audited success. Well-bound authorized
input with a recognized schema/business guard failure commits durable REJECTED.
Changed state does not un-reject that key; corrected/reevaluated intent needs
a new key. 40P01/40001/timeouts/connections/audit outage are technical, not guards.

## Replay and guard semantics

| Situation | Contract |
| --- | --- |
| Same full key and binding, first ACCEPTED | Original result/execution ID, replayed=true; no repeated handler/effect |
| Same full key and binding, first REJECTED | Original guard/details/open item, replayed=true; no reevaluation |
| Occupied key, changed command/version/principal/target/preconditions/payload | Nondisclosing GUARD_CONFLICT; no new outcome or overwritten winner |
| Different key, existing business fact | Owning command natural identity/registered guard decides, not generic success |
| Explicitly mapped matching duplicate fact | Durable new-key GUARD_IDEMPOTENT_DUP with no second fact |
| Incompatible mutation/stale state | Owning GUARD_CONFLICT/GUARD_STATE/GUARD_INVARIANT as catalogue specifies |
| Infrastructure or unknown COMMIT | Retryable/uncertain transport result; no fabricated durable rejection |

Accepted replay is not GUARD_IDEMPOTENT_DUP. DUP is only different-key semantic
duplicate under a registered owner rule. CompleteProductionOperation new-key
duplicate remains GUARD_CONFLICT (DATA-TX-001); do not replace it with DUP.
Receipt natural identity remains dependent on OQ-011. Nested production primitives
share their outer execution/key and never independently post. Unique SQL error
alone does not establish matching authorized fact content.

Store response schema/command versions, terminal kind, bounded safe result or
guard/open item, execution UUID and database decision timestamp. Replay returns
original semantic values, not stale headers/session state or an assertion the
resource remains in its original state. Current attempt ID/replayed metadata
changes, original execution ID does not.

## Transaction and concurrency

READ COMMITTED; one checked-out pg client; one explicit outer transaction.
No committed PENDING/claim/lease row, TTL/reaper, Redis or process-local mutex
as correctness mechanism. Defaults: lock_timeout=5s, statement_timeout=15s,
application deadline=30s. Deadline cannot permit duplicate work. First slice has
no hidden retry loop: explicit same-key retryable/uncertain response.
Rollback and release clients; destroy a client whose disposition is uncertain.

1. Admission/access, BEGIN and SET LOCAL timeouts.
2. Obtain pg_advisory_xact_lock(two signed int32s). Bytes: ASCII
   COMMAND_KEY_LOCK_V1, then each tuple UUID in tuple order, canonical lowercase
   UTF-8 preceded by unsigned 4-byte big-endian byte length. SHA-256 first eight
   bytes as two signed big-endian int32s. Hash collision merely serializes unrelated
   tuples. Domain/migration locks use separate documented namespaces.
3. SELECT by full tuple in a SEPARATE statement after acquisition: fresh READ
   COMMITTED snapshot sees committed winner. Recheck current permission.
   Existing identical binding replays; mismatch conflicts; neither calls handler.
4. If absent, generate execution UUID and SAVEPOINT before handler work.
   Owners acquire stable-ordered resource locks and enforce mutable guards,
   expected-version predicates and their unique constraints. Different keys
   do not serialize domain facts automatically.
5. ACCEPTED: owner facts, original acceptance audit and complete terminal outcome
   link commit together. REJECTED: ROLLBACK TO SAVEPOINT removes all tentative
   owner effects; persist rejection audit/outcome in same outer transaction.
6. Registered named business constraint mappings require savepoint recovery and
   authorized fact/content verification. Classify deadlock 40P01, serialization
   40001, timeout, connection loss/unknown SQL BEFORE business mapping: abort
   whole transaction, never durable business rejection.
7. COMMIT confirmation precedes terminal delivery. Fulltuple unique constraint
   is the final backstop; unexpected competing insert requires whole transaction
   rollback before same-key winner resolution, never its partial effects.

Outcome is inserted complete/terminal once, runtime has no UPDATE/DELETE grants.
Physical columns: fulltuple; execution UUID; principal issuer/subject;
command/version; typed target; canonical precondition/material bytes+SHA/version;
result version, kind, safe result/guard/open item; timestamp; original-audit FK.
Audit original execution ID has a unique original ACCEPTED/REJECTED decision.
Insert original audit first, outcome references it: no reverse outcome FK/cycle.
Replay/conflict audits may reference execution identity internally as authorized.
[Physical design](SLICE_ENVELOPE_PHYSICAL_DESIGN.md) freezes exact SQL types,
constraints/migrations; this specification controls their meaning.

## Audit and external effects

One AUD-CMD-ACCEPTED or AUD-CMD-REJECTED original audit commits with its outcome/
facts. Required related SoD/reversal/open-policy evidence shares that transaction.
Matching retry appends AUD-CMD-REPLAYED, not another original decision/event.
Mismatch appends safe AUD-CMD-CONFLICT; admission uses AUD-AUTHN-FAIL,
AUD-ACTOR-TEMP, AUD-ISOLATION-DENY or AUD-CMD-ADMISSION-DENIED.

Replay/conflict attempt audit commits before response through same transaction/
client. Audit failure returns technical failure and preserves original outcome.
Response loss can leave repeated legitimate attempt audits, never repeated facts.
Allowlist role/actor/scope, current attempt/correlation, command, permitted decision
identity and safe family/open item; no tokens/raw binding/results, connection
strings, SQL details or foreign-principal data.

No irreversible external effect before COMMIT. Event notice afterwards is not
proof of durable delivery. Later reliable external effect needs an atomic outbox/
inbox/deduplication ADR; none is introduced in SLICE-ENVELOPE.

## Crash, uncertainty, retention and recovery

| Failure window | Required behavior |
| --- | --- |
| Before terminal commit, including handler process crash | No committed fact/outcome/original audit; retry same key after aborted transaction releases lock |
| Commit acknowledged, response lost | Durable result replays after restart |
| COMMIT sent, acknowledgment lost | Uncertain; same full tuple/binding through PRIMARY waits on key lock, replays winner or executes only after previous abort |
| Primary unavailable/unresolved transaction | Preserve uncertainty; no new key, compensation or replica absence decision |
| Replay audit committed, response lost | Additional attempt audit allowed, original unchanged |
| Restore/PITR lost acknowledged history | Absent row is not nonexecution proof; disable admission and reconcile before writes |

Foundation retains full terminal outcomes/binding for installation lifetime,
no automatic TTL/purge/reuse. OQ-016 audit/backup day counts are not invented.
Later privacy/archive/tombstone changes require an ADR preserving non-reusable
identity and explicitly replacing result disclosure/replay requirements.

Restore outcome/original audit/owner facts as one database history. Consistent
PITR may still lose acknowledged writes within accepted RPO<=60min. No exactly-once
promise across unreconciled data loss. Command admission starts disabled after
restore until complete acknowledged-history survival is proved or reviewed
recovery fences all pre-recovery request generations and reconciles uncertainty.
Old intent cannot be reissued automatically with a new key. Ledger→Balance and
canonical facts→Genealogy reconstruction do not execute posting.
Durable production recovery fence/backup product is a later recovery/Go-Live
prerequisite, not a blocker to foundation implementation.

## Acceptance and proof limits

Future tests use real PostgreSQL and independent connections/processes:

- Durable accepted/rejected replay after restart; now-passing guard still replays
  old rejection under old key; original audit/effect once.
- Every binding mismatch, principal nondisclosure, old-version interpretation,
  absent/null/array/precondition difference; equivalent object order and forced
  hash collision with unequal bytes.
- Duplicate JSON names, lexical numeric range, Unicode, unknown/secret/bounds;
  bindable semantic rejection vs unbindable no-key admission failure.
- Matching/mismatching same-key races, winner rollback, fresh post-lock snapshot,
  unrelated tuple hash collision, independent scope isolation.
- Different-key fixture fact DUP/conflict with registered guard, no second fact.
- Savepoint rejected tentative writes, recognized constraint rollback and
  unexpected SQL/deadlock/timeout technical classification; audit atomicity.
- Crash before commit, response loss after commit, truly ambiguous commit,
  primary outage; no replica/new-key/automatic compensation.
- Revocation while lock waiter waits denies post-lock disclosure; creation
  replay result visibility and no raw secret/foreign data logging.
- Replay audit outage/ambiguity preserves winner, attempt counts independent.
- Complete immutable terminal row constraints, retained readers and no purge.
- Restore fixture omits acknowledged outcome; disabled admission refuses its
  automatic reexecution; rebuild does not post.
- Production host has no fixture command or auth shortcut; public owner ports
  and same transaction context are exercised by the harness.

These are future executable acceptance tests, not tests executed before
authorization. [Database/idempotency/security review](REVIEW_DATABASE_IDEMPOTENCY_SECURITY.md)
records observed findings/resolutions. Independent final readiness is separate.
ERP implementation remains locked.

