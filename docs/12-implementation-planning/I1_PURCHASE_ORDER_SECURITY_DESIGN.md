---
id: PLAN-I1-SECURITY-001
title: Proposed I1 operation authorization isolation and disclosure design
phase: 12-implementation-planning
status: in_review
version: 0.3.0
owners: [security-architect, chief-solution-architect]
depends_on: [APR-036, SRC-006, PLAN-I1-REFERENCE-001, APR-035, APR-034, SRC-005, ADR-0014, SEC-RBAC-001, SEC-ISO-001, PLAN-I1-API-001]
last_reviewed: 2026-10-21
approval: null
supersedes: null
---

# I1 security design — DRAFT / PROPOSED / NOT AUTHORIZED FOR IMPLEMENTATION

Business authority is confirmed by [SRC-005](../00-governance/team-answers/OWNER_I1_POLICY_CLARIFICATION_2026-10-20.md)
and [policy amendment](../02-domain-business-architecture/PURCHASE_RECEIVING_I1_POLICY_AMENDMENT.md).
This proposed translation into owner/object/transport checks changes no runtime
policy. Use [API](I1_PURCHASE_ORDER_API_DESIGN.md), [transactions](I1_PURCHASE_ORDER_DATABASE_DESIGN.md)
and [acceptance cases](I1_PURCHASE_ORDER_ACCEPTANCE_PLAN.md). The [final review](I1_PURCHASE_ORDER_FINAL_REVIEW.md)
now records R1 business resolution per SRC-006, separately from unapproved technical
generation and catalogue equality/resource recommendations. Named factory people
explain duties only; never compare names, display names or station labels.

## Effective operation-by-role matrix

ALLOW means approved business responsibility translated into a **proposed future
I1 policy**, not an implemented endpoint or current grant change. Each allow also
requires current personal organizational authority for the trusted factory.

| Operation | ACT-PROC | ACT-WH | ACT-SEC | ACT-CUST / other roles |
| --- | --- | --- | --- | --- |
| RegisterOperationalPurchaseOrder v1 | ALLOW | DENY | DENY | DENY |
| GetOperationalPurchaseOrderByReference / GetOperationalPurchaseOrder | ALLOW original-business projection | ALLOW same minimum original specifications | DENY | DENY |
| ListInboundCatalogueOptions (all three kinds, exact read/page) | ALLOW | ALLOW | DENY | DENY |
| AddInboundCatalogueOption v1 (all three kinds) | ALLOW | ALLOW | DENY | DENY |
| Amend/delete/cancel/append to an original registered order | No I1 operation | No I1 operation | No automatic override | DENY |
| Rename/delete/merge/deactivate catalogue or administer technical mapping | No I1 operation | No I1 operation | No automatic override | DENY |
| I2 actual receipt/progress/discrepancy/unordered acceptance | Separate future contract/policy | Separate future contract/policy | Separate disclosure decision | No inferred grant |
| Existing PostGoodsReceipt, documentary purchase/proforma, other eleven capabilities | Existing independent rules unchanged | Existing independent rules unchanged | Existing independent rules unchanged | Existing independent rules unchanged |

ACT-IPS remains the only inventory poster; no I1 policy calls it. WH's existing
manual receipt permission is not removed, but catalogue addition creates no new
receiving/exception authority. PROC cannot post stock by adding a material label.
ACT-SEC can administer grants under its existing security contract, but that does
not grant I1 business reads or a catalogue override. A person holding several roles
must select and currently hold the exact role used for an operation.

## Trusted boundary and current grants

Inspected [IdentityService](../../apps/backend/src/modules/identity/service.ts),
[IdentityAuthorization](../../apps/backend/src/modules/identity/authorization.ts),
[PostgresIdentityStore](../../apps/backend/src/infrastructure/postgresql/identity-store.ts),
[composition](../../apps/backend/src/composition-root.ts), [purchase HTTP](../../apps/backend/src/transport/purchase-http.ts)
and [shared command binding/execution](../../packages/shared-kernel/src/envelope/execute.ts).
The design reuses issued frozen, Identity-tracked ExecutionContext capabilities;
constructing/copying a frozen object with plausible claims must not grant access.
One opaque transaction is passed from the existing envelope to owner adapters.

Future explicit policies are registered for exact command/version pairs. canTarget
checks organizational context, configured factory mapping, operation role, expected
target kind/UUID and absence of customer/temporary scope. Current canExecute uses
Identity's current account/session/grant check; handlers recheck after their own
business locks. Input claims cannot replace issuer/subject/scope, actor, role,
recording time or existing grant. Admission rejects unknown property/credential
fields before saving arbitrary payloads. No new public generic-command or admin API.

Current installation UUID equals authority UUID for the single legal entity/site.
Every store lookup/insert and option reference uses trusted scope. DB equality
CHECKs and factory uniqueness reinforce that mapping; there is no client factory,
supplier or role argument to select a uniqueness partition. A second installation
is isolated; it cannot query/discover/reference another installation's sources.

## Narrow reads and enumeration

WH needs the original twelve business fields, complete line list, stable order/
line IDs/positions and selected option IDs/labels. The API's minimum projection
contains exactly that information plus fixed unit/calendar metadata. It contains
no binding, idempotency/request key, personal creator identity, supplier/proforma,
Inventory availability, I2 progress or arrival/driver data. PROC can use the same
minimum projection; private creation attribution remains in owner/audit sources.
No direct SQL/public read of full persistence rows is exposed.

Authorize before any object-existence lookup. Unauthorized roles get generic
forbidden regardless of whether the supplied number/UUID exists. After valid scoped
authorization, absent and foreign records share not-found; never query another
scope to distinguish them. Duplicate business/reference errors reveal only a
same-scope fact to an already permitted operator and do not return another creator
or the full order. Exact catalogue lookup after DUP is restricted to the same
authorized kind/factory and returns only option ID/kind/label.

There is no unbounded PO list or cross-factory search. Reference lookup uses a
bounded POST body, no raw reference in URL. Catalogue pages use bounded keyset
UUID ordering and no total count. Keep existing request concurrency/time bounds;
do not invent heavy infrastructure/rate-limit dependencies. Authorized operators
can necessarily distinguish their own factory's found versus absent order; do not
claim that required business lookup prevents all authorized enumeration.

## Revocation, locks, replay and disclosure

The existing envelope authorizes before transaction/key wait and again after the
key lock with current Identity state. Replay requires current execution plus
canDisclose, even for an old accepted or rejected result. Full principal/command/
version/target/payload/precondition binding stays in shared-kernel. Request ID and
actor role are not binding fields. No alternate idempotency service is introduced.

The same person, now granted the other allowed role, may replay a shared catalogue
command; original creator/role/time never changes. A different person with the
same key conflicts and cannot read the first outcome. PO register replay requires
PROC execution authority; WH's original-order query permission is insufficient.
Minimal accepted command data avoids disclosing private audit fields through replay.

Identity's transactional check locks account/session rows. Query owner reads use
one bounded READ COMMITTED write-mode transaction with current checks before and
after reads, commit/release then response; no domain write is implied by transaction
mode. Do not call FOR UPDATE checks inside read-only REPEATABLE READ or while
holding another pooled snapshot. Immutable I1 sources make the multi-SELECT
projection consistent without mutable progress views. Owner command guards repeat
current checks after waits. A revoker waiting behind held Identity row locks may
linearize later; only a committed earlier revocation must deny the operation.

Unknown-COMMIT recovery retains original principal/scope/key/target/full payload,
using the existing primary/recovery fence. Do not use another employee's identity,
new key, new UUID, label read or seller-number lookup as proof of command outcome.
If a completed business rejection is replayed, it stays rejected; a later resolved
business condition requires a deliberately new operation after the first outcome
is known, not an uncertain retry disguised as a new command.

## Catalogue integrity and privilege separation

Both roles may add a legitimate option and use it without another employee's
approval. All three catalogue kinds use the same authority rule; no hidden
administrator-only seed/approval state. No kind expands existing Inventory enums.
Exact scoped kind+label identity, target UUID binding and DB constraints prevent
accidental exact duplicate rows under concurrent authorized requests. Current
attribution/audit records each attempt without rewriting original creation facts.

Exact label equality intentionally does not merge case, whitespace, Arabic/Persian
variants or Unicode normalization forms. This conservative proposal must be accepted
explicitly; distinct terms remain distinct. Broader equivalence/aliases require
later policy, not a hidden normalizer or a semantic deduplication claim.
R1-A–D PO comparison policy is Owner-resolved. The [finite key specification](I1_PURCHASE_ORDER_REFERENCE_IDENTITY.md)
derives server-side from preserved raw text; no caller comparison key/profile is
accepted. A controlled STORED generated column prevents supplied-key forgery, with
app/DB parity and least-privilege EXECUTE on a pure frozen helper, no DDL rights.
Equivalent PO spellings share duplicate locks/UNIQUE/lookup but never rewrite full
raw-payload binding. Same-key changed raw still conflicts; original-key uncertainty
recovery uses original spelling. Catalogue labels remain exact-only and must not
use the PO normalizer. Same-scope duplicate disclosure stays authorized/minimal;
no broader search or comparison-key/creator/raw-input error echo.

Order lines reference immutable same-scope options of the expected kind. Wrong-kind
or foreign option IDs fail with the same safe state guard; no arbitrary free-text
label can bypass selection. Public creation authority does not permit renaming,
deleting, reclassifying, changing a past selection, accepting B06 goods or posting
stock. A new business type can be used in stock-free I1 without technical mapping;
mapping meaning/authority must be reconciled separately before I2 Inventory admission.

## Concrete threat and negative-proof obligations

| Threat / changed surface | Proposed control and future evidence |
| --- | --- |
| Cross-organization object references or scope injection | Trusted context only, both scope predicates, typed scoped FKs, same absent/foreign outcome; A18/A26 |
| WH edits an order through lookup or catalogue add | Closed distinct operations, immutable header/lines and DB append guard; A14/A17 |
| PROC or WH catalogue addition becomes stock/class authority | No technical-class/mapping field, no Inventory port, unchanged fixed enums and foreign tables; A15/A25 |
| Label/query injection or unsafe display | Parameterized values, API's explicit non-mutating blank/control predicate, validUnicode then128scalar/512byte decoded limits, JSON encoding, no HTML/template evaluation; A05/A13/A26 |
| Concurrent exact duplicate creation / changed target reuse | Sorted owner resource locks, authoritative PK/label uniqueness, DUP/CONFLICT semantics; A12/A20/A24 |
| Stale/forged identity and saved outcome leakage | Issued capability tracking, current grants/wait/replay checks and narrow projection; A19/A20 |
| Partial immutable source or false success after failure | One owner transaction, complete-line guard, outcome/audit atomicity and original-key recovery; A21–A24 |
| Sensitive input leaked in logs/errors | Fixed safe messages, no raw body/reference/label/token/SQL/constraint dumps; A18/A26 |
| Unbounded body/result/selection query | Dedicated bounded order reader, strict schemas, 1–128 lines independent of ordered unit count/IPS, exact serialized HTTP projection preflight<=256KiB including referenced labels, <=100 options/page; A26 |
| Historical label/order rewrite | SELECT/INSERT-only new-source runtime grants, immutable reference rows, no update/delete/append routes; A14/A27 |

Browser XSS/CSRF page flows, uploads/attachments, outbound device/file requests,
SSRF and dependency-advisory changes have no changed executable surface here.
Safe label rendering is retained as a future UI obligation, not browser development.
No package is installed or upgraded; no dependency audit is claimed. All reviews
are static design reviews, not runtime security certification. No OS containment,
new auth provider or large security subsystem is introduced.
