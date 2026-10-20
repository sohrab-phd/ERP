---
id: PLAN-I1-DATABASE-001
title: Proposed I1 PostgreSQL schema concurrency and atomic transaction design
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [data-architect, chief-solution-architect]
depends_on: [APR-034, PLAN-I1-DOMAIN-001, PLAN-I1-API-001, ADR-0011, ADR-0013, ADR-0014]
last_reviewed: 2026-10-20
approval: null
supersedes: null
---

# I1 PostgreSQL and transactions — DRAFT / PROPOSED / NOT AUTHORIZED

This is a relational/constraint specification, not an executable migration. No SQL
file, TypeScript contract, runtime grant or product gate is created. Refer to
[domain/values](I1_PURCHASE_ORDER_DOMAIN_DESIGN.md), [API/error semantics](I1_PURCHASE_ORDER_API_DESIGN.md),
[security](I1_PURCHASE_ORDER_SECURITY_DESIGN.md) and [decision acceptance](I1_PURCHASE_ORDER_DECISIONS.md).
PostgreSQL 18.6 and existing pg/Node/root-script pins remain unchanged.

## Current persistence and proposed ownership

Inspected [0015 purchasing evidence](../../database/migrations/0015_purchasing_evidence.sql),
[PostgresPurchaseStore](../../apps/backend/src/infrastructure/postgresql/purchase-store.ts),
[transaction adapter](../../apps/backend/src/infrastructure/postgresql/transaction.ts),
[outcome adapter](../../apps/backend/src/infrastructure/postgresql/outcome-store.ts),
[audit adapter](../../apps/backend/src/infrastructure/postgresql/audit-store.ts),
[kernel execution](../../packages/shared-kernel/src/envelope/execute.ts),
[Identity session locking](../../apps/backend/src/infrastructure/postgresql/identity-store.ts)
and [runtime test-role setup](../../tools/db/reset-test.mjs). Current documentary
sources are insert/select-only for the restricted role, independent of Inventory.
New sources belong to Procurement, with the same owner adapter/opaque transaction
pattern. Shared runtime DB credentials do not replace module SQL/import ownership;
future [boundary checks](../../tools/build/check-boundaries.mjs) must cover new tables.

## Common scope, identity and trusted metadata

All three tables carry installation_id UUID and authority_scope UUID, NOT NULL,
CHECK authority_scope = installation_id. This is the existing configured single-
factory authority mapping, not a multi-tenant design. Owner SQL always predicates
both trusted columns. Uniqueness of seller reference is on installation plus exact
reference, deliberately not only an authority tuple that could accidentally split
the factory, and never on supplier/creator/role/date. A topology change requires
an approved migration/policy reconciliation, not a caller scope parameter.

Header and option private metadata: binding text = canonical parsed owner input,
bounded to 262144 UTF-8 bytes; issuer/subject each <=256 bytes; actor_role; request_id
UUID; idempotency_key UUID; recorded_at timestamptz DEFAULT clock_timestamp().
No client can supply those fields. Kernel independently retains full admitted
principal/command/target/payload/precondition binding and original outcome/audit.
Owner binding comparison is not a substitute for shared-kernel key binding.
Line creation attribution is inherited from its immutable parent source.

IDs are PostgreSQL UUID, references/labels are text COLLATE C. Exact source strings
are stored unchanged, not CITEXT, CHAR(n), locale-normalized values or hashes used
as sole equality truth. Hashes are lock-routing aids only. All unique/FK constraints
below are named; ordinary unique constraints are immediate/nondeferrable.

## Proposed tables and constraints

### procurement.inbound_catalogue_option

| Column(s) | Proposed type/nullability | Integrity rule |
| --- | --- | --- |
| installation_id, authority_scope | UUID NOT NULL | Common trusted single-factory scope |
| option_id | UUID NOT NULL | i1_option_pk = PK(scope tuple, option_id) |
| catalogue_kind | text NOT NULL | Exactly MATERIAL_TYPE / QUALITY_GRADE / COLOR; this enum names the three catalogues, not stock material classes |
| label | text COLLATE C NOT NULL | 1–128 UTF-8 bytes, nonblank, valid source text, no Cc; exact comparison |
| binding and creation metadata | As above, NOT NULL | actor_role in ACT-PROC/ACT-WH; DB time independent of business dates |

Named i1_option_label_uq UNIQUE(installation_id,catalogue_kind,label) is the final
duplicate-admission guard across both roles. i1_option_kind_id_uq UNIQUE(scope
tuple,catalogue_kind,option_id) is the referenced typed key for lines. The PK
prevents same option ID being rebound under another kind. No catalogue business
seed values, mutable state, technical class mapping, soft-delete or update timestamp.

### procurement.operational_purchase_order

| Column(s) | Proposed type/nullability | Integrity rule |
| --- | --- | --- |
| installation_id, authority_scope | UUID NOT NULL | Common scope |
| order_id | UUID NOT NULL | i1_po_pk = PK(scope tuple,order_id) |
| order_reference | text COLLATE C NOT NULL | Same exact 1–128-byte nonblank text rule as API |
| registration_jy, registration_jm, registration_jd | smallint NOT NULL | Explicit Jalali components; fixed supported profile/year/month/day/leap CHECKs below |
| calendar_profile | text NOT NULL | Fixed UT-JALALI-1206-1498-v1; technical provenance, not another entered field |
| line_count | integer NOT NULL | 1–128 from the admitted array; never received quantity |
| binding and creation metadata | As above, NOT NULL | actor_role exactly ACT-PROC |

i1_po_reference_uq UNIQUE(installation_id,order_reference) enforces the confirmed
factory-wide business identity transactionally. i1_po_count_uq UNIQUE(scope
tuple,order_id,line_count) supports the line's frozen declared count. No link/FK
to completed_purchase, proforma, receipt, supplier master or Inventory. No progress,
open/closed/amended status or inferred stock total.

### procurement.operational_purchase_order_line

| Column(s) | Proposed type/nullability | Integrity rule |
| --- | --- | --- |
| installation_id, authority_scope, order_id | UUID NOT NULL | Parent scope/id; no foreign organization |
| line_id | UUID NOT NULL | i1_line_pk = PK(scope tuple,line_id), independently generated for every array member |
| declared_line_count, position | integer NOT NULL | Copied parent count and immutable ordinal; 1 <= position <= declared_line_count |
| item_number, ral_color_number | text COLLATE C NULL | Optional exact provided text; no uniqueness or invented format |
| material_type_option_id, material_type_kind | UUID / text NOT NULL | Kind fixed MATERIAL_TYPE; required typed same-scope option FK |
| color_option_id, color_kind | UUID NULL / text NOT NULL | Kind fixed COLOR; optional option FK if ID present |
| quality_grade_option_id, quality_grade_kind | UUID NULL / text NOT NULL | Kind fixed QUALITY_GRADE; optional option FK if ID present |
| width_m_text, thickness_mm_text | text NOT NULL | Exact domain decimal grammar/positive/magnitude/scale checks; original lexeme retained |
| length_m_text | text NULL | Same checks if present; no zero/default substituted for absence |
| unit_weight_kg_text, ordered_unit_count_text | text NOT NULL | Positive 1–20 ASCII-digit strings; no fraction, bigint coercion or floating-point quantity |

i1_line_parent_count_fk references the parent scoped (order_id,line_count) key;
the copied count is technical consistency data, not another quantity source.
i1_line_position_uq UNIQUE(scope tuple,order_id,position) keeps original array
order and permits identical business specs. i1_line_order_identity_uq UNIQUE(scope
tuple,order_id,line_id) provides an additive future I2 parent-and-line FK target.
Three typed option FKs reference i1_option_kind_id_uq with fixed kind columns.
Optional color/grade IDs use normal nullable FK semantics; kind remains fixed,
never a client field. No FK CASCADE deletes, cross-owner table write or attribute-
based uniqueness. There is no public operation to insert a standalone line.

## Exact values, immutability and aggregate closure

Dimension strings are at most 39 ASCII characters. A CHECK first tests the bounded
decimal grammar, then CASE-guards an unconstrained numeric cast and compares >0 and
<10^20. Guarded branches must make malformed casts unreachable. Integer weight/count
grammar itself proves positive <10^20; no PostgreSQL bigint can cover that whole
range. Numeric evaluation is exact and never casts through NUMERIC(p,s), real,
double precision or JavaScript Number. Explicit schema/API checks reject unsupported
fraction digits instead of rounding. Store accepted source lexemes, including
trailing zeros, so output never relies on driver numeric formatting.

Jalali CHECKs enforce the domain's finite profile, year 1206–1498, month 1–12 and
day <=31/30/29-or-30. The Esfand leap predicate is the same frozen, independently
verified official year set as the application validator. It is an inline constraint,
not a DATE cast or current-time/network function. No leap data/code is added now.
Any profile extension requires reviewed additive validation evolution; historical
date components and profile interpretation cannot be silently changed.

Runtime grants for new tables are SELECT/INSERT only; no UPDATE, DELETE, TRUNCATE,
ALTER or ownership. App roles retain no function/DDL privilege through this scope.
Catalogue references and line/header literals therefore preserve original meanings.
Maintenance/migration credentials are outside runtime and must not be used by APIs.

Insert-only access alone does not freeze a multi-line aggregate: someone could
append another line later. Proposed closure: immutable parent line_count, each
line's parent-count FK, bounded unique positions, and i1_po_complete_ck, a deferred
constraint trigger on header insertion requiring exactly line_count child rows at
transaction end. All positions 1..N must then be occupied; a later append must
either duplicate a position or violate the bound/FK. No authorized delete/update
can create a hole. This closes both initial partial-header and later-append cases.

The trigger needs one small invoker-rights, fixed-search-path, SELECT-only integrity
function under Procurement. It is **PROPOSED I1-D10**, requiring explicit design
acceptance; it is not a stored command/posting kernel or new orchestration writer.
The application continues to own the business transaction. An alternative of only
application validation/privileges lacks this DB-level append/completeness guard.
[PostgreSQL constraint triggers](https://www.postgresql.org/docs/18/sql-createtrigger.html)
permit deferred integrity checks; no executable function/DDL is created here.

## Query indexes and limits

Existing scoped PKs serve ID reads. i1_po_reference_uq serves the one exact seller-
number lookup, with authority verified against the trusted factory mapping.
i1_line_position_uq serves full ordered line retrieval; typed option PK/FK indexes
serve label joins. Add a catalogue index (installation_id,authority_scope,
catalogue_kind,option_id) for bounded keyset pages. The label unique index serves
exactLabel selection. No full-text, fuzzy-normalization, supplier or status index
without an I1 access path. No I1 stock/progress projections or background worker.

## Transaction and resource ordering

Reuse [executeCommand](../../packages/shared-kernel/src/envelope/execute.ts): bounded
admission/current permission outside a write transaction; then scoped command-key
lock; fresh READ COMMITTED outcome lookup; recovery fence/current authorization;
replay or handler savepoint. Identity's transactional current check locks account
then session before owner business locks. Do not create nested public command calls.

Owner resource names are explicit scoped strings with a new I1 namespace:
order target UUID + factory reference for registration; option target UUID + factory
kind/exact label for addition. Snapshot admitted input, precompute the entire set,
map to existing-style hashtextextended signed bigint keys, deduplicate collisions
and acquire by actual signed numeric key order. Do not sort only UUID strings or
start another lock class mid-loop. Hash collisions can serialize unrelated work,
but never establish identity; authoritative UNIQUE/PK constraints still decide.
No new I1 operation acquires an IPS/Sheet/stock lock.

Lock hierarchy: kernel key -> Identity account/session -> complete sorted I1 owner
resource set -> source inserts/FK checks. Catalogue references are immutable reads;
their FK key-share locks have no runtime update/delete counterpart. Different
commands do not invoke each other or request another command key. READ COMMITTED
statements after a business-lock wait see committed winners. Recheck current
authority after owner waits and before final source writes/decision.

A committed revocation before current-check linearization denies work. If Identity
row locks are already held, a concurrent revoker can wait and the business command
can linearize before that revocation; do not promise a revocation that has not
committed wins the race. Session expiry still needs a fresh clock/current check.
Race tests must use distinct people to reach owner locks rather than accidentally
testing same-account Identity serialization only.

## Four transaction cases

1. **Register order:** validate closed fields, numeric/Jalali rules and complete
   array; acquire owner resources; current check; target binding then reference
   uniqueness; read scoped typed catalogue options; preflight full read projection
   <=256 KiB; allocate line UUIDs/positions and insert header+all lines; final current
   check; return minimal accepted decision. Kernel records outcome/audit on the
   same opaque transaction and commits. Owner never commits or writes kernel tables.
2. **Add option:** validate kind/label; acquire target/label resources; current check;
   target/label duplicate guards; insert one immutable option with trusted metadata;
   final current check; kernel outcome/audit commit. No order write or stock port.
3. **Add then register:** two independent durable commands/keys in sequence, accepted
   option becomes immediately reusable by either role. If the later order rejects,
   the option remains a valid reusable reference; no header or child line survives.
   This is not a promise to roll back a previously accepted catalogue command.
   Resolve uncertain add with its original key before sending the dependent order.
4. **Concurrent duplicate PO numbers:** different users/targets/keys serialize on
   the factory reference; first committed order wins, second rejects GUARD_CONFLICT.
   Final immediate UNIQUE enforcement remains authoritative even if a path misses
   the advisory lock. Neither losing transaction rewrites/merges the winner.

## Constraint classification, failure and recovery

Service prechecks and current guards produce normal durable business rejections.
Explicit constraintRejections may map only known immediate 23505 names after the
kernel recovers its handler savepoint: i1_po_reference_uq -> scoped recheck then
GUARD_CONFLICT; i1_po_pk/i1_option_pk -> compare surviving immutable binding for
DUP versus CONFLICT; i1_option_label_uq -> exact scoped DUP. Mapping rechecks current
authority and scoped rows; if no expected surviving fact explains a violation,
return no mapping and fail technically. Never classify arbitrary SQL codes or
unknown constraints as business rejection, and never return accepted reuse from
the rejection-only mapper. Savepoint rollback may release owner locks acquired
after it; immutable winner facts and fresh scoped queries must suffice for mapping.

Wrong-kind/missing catalogue is validated before insert as GUARD_STATE; unexpected
FK/CHECK failure is a technical integrity failure, not a fabricated business rule.
The deferred i1_po_complete_ck failure occurs at COMMIT, outside the handler's
23505 mapping path. Existing commit adapter can conservatively report uncertain
for such a server error; do not claim it produces a durable rejection. The
transaction fails with no partial header/lines/outcome/audit; original-key primary
recovery resolves uncertainty. Normal shape/count validation avoids this final
guard for ordinary user input. No shared commit classifier change is necessary.

Later-line business failure rolls back all tentative owner facts to the handler
savepoint and permits one durable rejected outcome/audit. Technical, timeout,
deadlock, connection, outcome or audit failures abort the whole transaction; no
cached false rejection or surviving partial sources. Existing transaction deadlines
(default 5s lock/15s statement/30s overall) remain, not new automatic infinite retry.
Only the original bound key/principal/scope/target/full input can recover an
unknown COMMIT. A business reference lookup is not a substitute for command recovery.

## Read transaction boundary

Use one ordinary existing write-mode READ COMMITTED transaction for I1 queries,
with current Identity locks before and after source reads; commit/release then
return safe projection. This permits the current isCurrent locking implementation.
Do not call it within a read-only repeatable-read transaction. Immutable registered
orders/catalogue rows make several source SELECTs coherent: no header is visible
without committed lines, no catalogue rename can race. Catalogue pagination is
bounded independent snapshots, not a promised globally frozen list. No nested
connection/pool acquisition while retaining another snapshot is required.

## Additive implementation sequence — proposed only

After Owner design acceptance and bounded implementation/gate authorization:

1. Reserve the next migration number after existing 0016 (currently expected 0017;
   verify again then), create catalogue, order, line, keys/checks/indexes and the
   SELECT-only completeness guard in one transactional migration. No old checksum,
   schema, record or business seed value changes.
2. Extend controlled runtime/test-role setup for SELECT/INSERT on new sources,
   guard function execution as needed, and explicit owner boundary checks. No
   permissions on Inventory/Finance/Sales/Shipping/Production are added by I1.
3. Add owner services/adapters, scoped admission/policies/HTTP and future tests only
   within the separately approved implementation scope; preserve old v1 routes.
4. Prove migration replay/checksums, runtime privilege denial, constraints, real-PG
   races/rollback/recovery and absence of foreign effects before capability acceptance.

Nothing in this sequence is executed or created by Step 3. Backward compatibility
with all eleven capabilities and safe I2 extension are acceptance obligations,
not implementation evidence.
