---
id: PLAN-I1-DATABASE-001
title: Proposed I1 PostgreSQL schema concurrency and atomic transaction design
phase: 12-implementation-planning
status: in_review
version: 0.3.0
owners: [data-architect, chief-solution-architect]
depends_on: [APR-036, SRC-006, PLAN-I1-REFERENCE-001, APR-035, APR-034, PLAN-I1-DOMAIN-001, PLAN-I1-API-001, ADR-0011, ADR-0013, ADR-0014]
last_reviewed: 2026-10-21
approval: null
supersedes: null
---

# I1 PostgreSQL and transactions — DRAFT / PROPOSED / NOT AUTHORIZED

This is a relational/constraint specification, not an executable migration. No SQL
file, TypeScript contract, runtime grant or product gate is created. Refer to
[domain/values](I1_PURCHASE_ORDER_DOMAIN_DESIGN.md), [API/error semantics](I1_PURCHASE_ORDER_API_DESIGN.md),
[security](I1_PURCHASE_ORDER_SECURITY_DESIGN.md) and [decision acceptance](I1_PURCHASE_ORDER_DECISIONS.md).
PostgreSQL 18.6 and existing pg/Node/root-script pins remain unchanged.
The [R1 specification](I1_PURCHASE_ORDER_REFERENCE_IDENTITY.md) now controls raw
reference and derived identity; SRC-006 resolves its business rules. Quantity,
resource and completeness proposals retain their independently reviewed conditions.

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
comparison key, deliberately not only an authority tuple that could accidentally split
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
| label | text COLLATE C NOT NULL | 1–128 Unicode scalars, <=512UTF-8bytes; API's explicit blank/control predicate, exact comparison |
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
| order_reference | text COLLATE C NOT NULL | Same exact128scalar/512byte text rule and blank/control predicate as API |
| order_reference_key | text COLLATE C NOT NULL, GENERATED ALWAYS STORED | Derived only from raw reference by controlled po_reference_key_r1_v1; nonempty, <=128scalars/512bytes |
| reference_key_profile | text NOT NULL, fixed default/CHECK | Exactly PO-REF-R1-A-v1; private provenance, never a uniqueness partition or caller input |
| registration_jy, registration_jm, registration_jd | smallint NOT NULL | Explicit Jalali components; fixed supported profile/year/month/day/leap CHECKs below |
| calendar_profile | text NOT NULL | Fixed UT-JALALI-1206-1498-v1; technical provenance, not another entered field |
| line_count | integer NOT NULL | 1–128 from the admitted array; never received quantity |
| binding and creation metadata | As above, NOT NULL | actor_role exactly ACT-PROC |

i1_po_reference_uq UNIQUE(installation_id,order_reference_key) transactionally
prevents all equivalent references under Owner-approved R1-A–D, including distinct
raw spellings/keys/people. Original raw order_reference stays immutable and is not
itself the unique key. The [finite ordered transform](I1_PURCHASE_ORDER_REFERENCE_IDENTITY.md)
also governs app key locks, DB lookup and source validation. No supplier/profile
partition or broader normalizer; catalogue labels remain exact and unaffected.
i1_po_count_uq UNIQUE(scope
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

Existing0005numeric stock CHECKs and Kg enforce magnitude<10^20/scale<=18;0006
whole receipt kg<10^20. New W1 fits each existing per-unit capacity, not a new
provenance/admission rule. Count20digits and dimension20/18 are separately proposed
representation ceilings. Derived line product may have40digits, order sum43digits:
keep them in a distinct Procurement BigInt/derived-total representation, never
these stock columns, Kg, measuredKg or an IPS effect. Never iterate/create Units
from the ordered count. I2 must validate its actual per-unit and group arithmetic
through approved owner ports; no restriction on total ordered mass is invented now.

New text CHECKs use UTF8 database encoding, char_length between1and128 and
octet_length<=512, plus the API's exact explicit codepoint predicates for Cc/blank.
char_length counts Unicode scalars here, not UTF16 code units/graphemes. PostgreSQL
cannot store U+0000; do not construct chr(0). Neither btrim nor locale regex classes
are a substitute for the frozen predicate. Selected source text is never trimmed
or normalized. The final migration must prove app/DB parity for NBSP, FEFF, ZWNJ,
combining marks, supplementary scalars and decoded JSON escapes. Bounded512byte
labels/references keep ordinary UTF8 btree keys small without hash-only equality;
verify actual index limits under the pinned PostgreSQL build in future acceptance.

Jalali CHECKs enforce the domain's finite profile, year 1206–1498, month 1–12 and
day <=31/30/29-or-30. The Esfand leap predicate is the same frozen, independently
verified official year set as the application validator. It is an inline constraint,
not a DATE cast or current-time/network function. No leap data/code is added now.
Any profile extension requires reviewed additive validation evolution; historical
date components and profile interpretation cannot be silently changed.

Runtime grants for new tables are SELECT/INSERT only; no UPDATE, DELETE, TRUNCATE,
ALTER or ownership. The sole extra pure-helper privilege is EXECUTE on controlled
po_reference_key_r1_v1 as generation/lookup require; PUBLIC EXECUTE revoked, fixed
pg_catalog search path, SECURITY INVOKER, IMMUTABLE STRICT PARALLEL SAFE. No function
CREATE/ALTER/replacement, SECURITY DEFINER or business posting privilege is granted.
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

Exact mechanism: one AFTER INSERT FOR EACH ROW constraint trigger on the header,
DEFERRABLE INITIALLY DEFERRED, runs once per new header, scoped to NEW installation,
authority and order. At end of transaction it counts lines through the indexed
parent/position key and compares to frozenN. It sees this transaction's own complete
line inserts. With N distinct positions all within1..N, count=N fills every slot;
any later append must violate position uniqueness, range or parent-count FK.
Normal FKs only require a line's parent; atomicity only commits the statements
actually issued. Neither requires the promised N children nor stops a later insert.

The SELECT-only function acquires no explicit advisory/row locks, performs no
writes or command calls and cannot recursively trigger itself. The parent FK
prevents another transaction from attaching to an uncommitted parent; a committed
complete parent's bounded positions leave no free slot. Different headers need no
common closure lock. Same-reference concurrency remains serialized/guarded by its
owner lock and immediate UNIQUE. Ordinary FK/unique waits and timeout/deadlock
handling still apply; no universal deadlock-free claim. Header-only/short/gapped
aggregates fail; excess lines fail earlier position/FK guards. A failed later line
rolls back all source inserts. ROLLBACK TO SAVEPOINT also discards pending trigger
events for rolled-back headers; no stale closure check should block a valid durable
rejection. A guard forced early with SET CONSTRAINTS may reject an incomplete
transaction technically; owner registration must not force it before all lines.

Alternatives: (a) application-only closure is simpler but fails direct restricted-
role malformed insertion/append protection; (b) one immutable JSON line array
closes the document naturally but loses ordinary typed line/catalogue FKs and
simple future I2 line references without extra integrity machinery; (c) deferred
cyclic seal/array-key designs replace one count check with more keys/state. Retain
the small guard for the normalized model. Existing
[0012 integrity migration](../../database/migrations/0012_production_sources.sql)
is an integrity-trigger/deferred-FK precedent, not automatic approval of this new
mechanism. Migration owner creates it; runtime only invokes approved integrity
behavior. No stored posting kernel, trigger-based transaction owner or foreign
module write is introduced. Real-PG proof in A14/A23/A27 remains mandatory later.

## Query indexes and limits

Existing scoped PKs serve ID reads. i1_po_reference_uq serves normalized seller-
number lookup, with authority verified against the trusted factory mapping. The
STORED generated key cannot be supplied/overridden by an INSERT caller. Use explicit
U+0020 btrim and finite translate mappings in a frozen v1 SQL helper; app derives
the same key for locks, DB derives/validates it for persistence and lookup. INSERT
RETURNING key/profile and lookup derivation are compared to the app result; drift
fails technically with no accepted source. Details/options/version obligations are
in the identity specification. No executable function or migration is created now.
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
order target UUID + factory R1 comparison key/profile for registration; option target UUID + factory
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
   array and raw reference; derive R1 key without replacing bound payload; acquire
   owner resources; current check; original target binding then normalized-key
   uniqueness; read scoped typed catalogue options; allocate/freeze line UUIDs and
   positions in memory; build and preflight the exact full read projection including
   those IDs, its HTTP data wrapper and escaping <=256KiB; only then insert
   header+all lines, verify DB-generated key/profile equals app derivation; final current
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
4. **Concurrent duplicate PO numbers:** different users/targets/keys and equivalent
   raw spellings serialize on the factory comparison key; first committed order
   wins, second rejects GUARD_CONFLICT. An aborted predecessor permits a new winner.
   Final immediate UNIQUE enforcement remains authoritative even if a path misses
   the advisory lock. Neither losing transaction rewrites/merges the winner.

## Constraint classification, failure and recovery

Service prechecks and current guards produce normal durable business rejections.
Explicit constraintRejections may map only known immediate 23505 names after the
kernel recovers its handler savepoint: i1_po_reference_uq -> scoped normalized-key winner recheck then
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
   SELECT-only completeness guard plus frozen R1 helper/STORED key/profile in one
   transactional migration. No old checksum,
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
