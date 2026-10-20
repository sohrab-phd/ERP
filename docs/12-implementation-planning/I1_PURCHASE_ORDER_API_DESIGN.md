---
id: PLAN-I1-API-001
title: Proposed I1 purchase order and shared catalogue commands and queries
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [api-architect, chief-solution-architect, security-architect]
depends_on: [APR-034, PLAN-I1-DOMAIN-001, PLAN-COMMAND-IDEMPOTENCY-001, ADR-0014]
last_reviewed: 2026-10-20
approval: null
supersedes: null
---

# I1 contracts — DRAFT / PROPOSED / NOT AUTHORIZED FOR IMPLEMENTATION

These are Markdown specifications, not published TypeScript/OpenAPI contracts or
registered routes. [Domain field rules](I1_PURCHASE_ORDER_DOMAIN_DESIGN.md),
[database/transaction rules](I1_PURCHASE_ORDER_DATABASE_DESIGN.md) and
[security matrix](I1_PURCHASE_ORDER_SECURITY_DESIGN.md) are normative **within this
proposal only**. All I1-D decisions need Owner acceptance and separate implementation
authorization. Existing completed-purchase/proforma/receipt v1 contracts stay unchanged.

## Minimal operation surface

All operations belong to Procurement. Actor is an individually authenticated,
currently granted organizational role; no customer scope or temporary actor.
All query specifications are v1 semantics; HTTP read endpoints are fixed v1 shapes,
not new durable commands or callers of public command execution.

| Operation | Proposed name / version | Target/source identity | Roles | HTTP proposal |
| --- | --- | --- | --- | --- |
| Register order and all lines | RegisterOperationalPurchaseOrder / 1 | target kind operational-purchase-order; target.id caller technical create UUID; business identity exact factory-wide orderReference | ACT-PROC only | POST /purchasing/operational-orders |
| Add one reference option | AddInboundCatalogueOption / 1 | target kind inbound-catalogue-option; target.id caller technical option UUID; business identity factory + catalogue kind + exact label | ACT-PROC, ACT-WH | POST /purchasing/inbound-catalogues |
| Original order by seller reference | GetOperationalPurchaseOrderByReference / v1 query | exact orderReference, scope derived from Identity | ACT-PROC, ACT-WH | POST /purchasing/operational-orders/lookup |
| Original order by technical ID | GetOperationalPurchaseOrder / v1 query | validated order UUID in trusted scope | ACT-PROC, ACT-WH | GET /purchasing/operational-orders/{orderId} |
| Reference selection / exact duplicate resolution | ListInboundCatalogueOptions / v1 query | catalogue kind, optional exact label and bounded UUID cursor | ACT-PROC, ACT-WH | POST /purchasing/inbound-catalogues/query |

The ID read supports post-registration retrieval and stable links returned by the
seller-number lookup; it does not replace the factory number workflow. There is
no order-list/export query, PO edit, batch reference creation, inline option creation,
receiving/progress endpoint, catalogue administration or anonymous bootstrap route.

## Common admission, serialization and transport

Commands use exactly the existing six envelope members: command, contract_version,
idempotency_key, target, payload, preconditions. Preconditions must be `{}`. Target
is `{kind,id}`; validUuid canonical lowercase syntax is reused (versions 1–8 as
currently admitted), and idempotency keys retain strict UUID-v4 validation.
Server-generated line IDs use UUID v4. Scope, principal, actor, role, request ID,
DB time and supplier information are not new payload fields.

Only the named command/version/target pair can execute. Register both active v1
contracts explicitly in the future owner registry and explicit Identity policies;
all other I1 versions are unregistered. Unknown versions, target mismatch in the
proposed admission policy, unknown envelope/property names, secrets,
duplicate JSON names, invalid Unicode/encoding or over-limit input fail closed
without consuming a business key. Known admitted fields with missing/invalid
required values produce durable GUARD_INVARIANT rejection. No legacy contract is
relaxed to accept new fields. Arrays preserve order in full binding. A future
registered-but-inactive contract follows existing kernel replay/admission policy:
the kernel checks an existing outcome before its new-execution active check, so
do not claim every inactive version is rejected before key lookup or cannot replay.

Current [identity-http requestJson](../../apps/backend/src/transport/identity-http.ts)
caps HTTP bodies at 4096 bytes; the [shared parser](../../packages/shared-kernel/src/envelope/canonical-json.ts)
permits 256 KiB. PROPOSED new operational-order transport reader has explicit
2–262144 byte Content-Length, application/json UTF-8, no transfer encoding,
strict actual byte-length equality, 5-second body deadline and the shared bounded
parser. Do not raise the existing Identity/documentary-route limits. Add-option and
query POST bodies can reuse the existing 4096-byte reader. Envelope canonical/result
limits remain 256 KiB, depth 32, 10000 entries and 64 KiB per string; no shared-kernel
change. New handler active-request cap is 16, matching current purchasing practice.

All routes require one unambiguous x-erp-role selector for the operation's allowed
roles and a personal bearer session. Selector is checked by Identity, not treated
as authority; absent/duplicate/unrelated selector is forbidden in these new routes.
Reject Origin as existing internal APIs do. No new CORS/browser contract. GET has
no body; reject transfer encoding/nonzero Content-Length. Responses retain UTF-8
JSON, no-store and nosniff through current respond. Exact references/labels belong
in POST read bodies to avoid URL/access-log encoding of business values.

Text limits (PROPOSED I1-D14): reference, item number, RAL and catalogue label each
1–128 UTF-8 bytes, validUnicode, no Unicode Cc characters and not all whitespace.
Preserve text without trim/normalization; ZWNJ/Persian terms remain usable. A
provided optional blank/null value is invalid. Safe JSON encoding is mandatory;
labels are data, not HTML/code. Output limits must be preflighted before registration
so a committed order is always readable in full, never silently truncated.

## RegisterOperationalPurchaseOrder v1

Payload is a closed object:

| Member | Required / shape | Validation |
| --- | --- | --- |
| orderReference | YES / text | Exact field 2 under text rule and factory-wide identity |
| registrationDateJalali | YES / text | Field 17, domain's explicit Jalali date/profile; no default |
| lines | YES / array of closed objects, 1–128 | Complete original ordered array; no append/merge deduplication |

Each line allows exactly itemNumber?, materialTypeOptionId, widthM, thicknessMm,
colorOptionId?, ralColorNumber?, lengthM?, qualityGradeOptionId?, unitWeightKg,
orderedUnitCount. Required fields and units are the [exact twelve-field table](I1_PURCHASE_ORDER_DOMAIN_DESIGN.md#exact-twelve-field-contract).
Optional `?` means omission, not JSON null. Catalogue IDs must exist, belong to
trusted scope and match their expected kind. Any unknown or foreign option yields
the same safe GUARD_STATE message, without disclosing foreign existence. No caller
lineId/ordinal, typed Inventory classification, received quantity, W2/W3, supplier,
physical code or actor is accepted. Material Type is a selected business option.

After validation/current authority and all owner locks: first check target UUID
binding, then reference uniqueness. Same target under a different key rejects
GUARD_IDEMPOTENT_DUP for identical ordered facts or GUARD_CONFLICT for different
facts. An unused target with an already-used factory reference rejects GUARD_CONFLICT
regardless of matching fields. No overwrite, automatic merge or historical link.
The final unique constraint remains authoritative, with explicit constraint mapping.

Accepted StableResult: fact_identity = orderId; event = OperationalPurchaseOrderRegistered;
data = `{orderId, lineCount}`. No full order, audit identity, binding bytes or stock
effect in the durable result. Exact line IDs/specifications are returned by queries.
No unnecessary new state machine; successful persistence is the registered fact.
All header/line/snapshot sources, original outcome and one kernel audit commit
together. Business rejection leaves no partial order/lines. Audit/technical failures
do not become durable business rejections.

## AddInboundCatalogueOption v1

Closed payload `{catalogue,label}`. Catalogue is exactly MATERIAL_TYPE,
QUALITY_GRADE or COLOR; label obeys text rules. Both roles have identical scoped
add/select authority without another employee's approval. It grants no edit/delete/
merge/technical mapping or PO mutation capability.

Acquire target-ID and exact scoped catalogue-label resources, recheck authority,
then check target binding and exact duplicate identity. Existing target under a
new key: identical facts GUARD_IDEMPOTENT_DUP, changed facts GUARD_CONFLICT. New
target but exact existing scoped kind+label: GUARD_IDEMPOTENT_DUP. Labels differing
in case, Unicode form, Arabic/Persian letters, spaces or ZWNJ are not declared
equivalent and are not silently merged. Equal text in different catalogues/scopes
is independent. These exact-equivalence semantics are a proposed acceptance choice.

Accepted StableResult: fact_identity = optionId; event = InboundCatalogueOptionAdded;
data = `{optionId,catalogue}`. Creation records trusted issuer/subject/original
actor role, request/key and DB time privately. Subsequent attempts never overwrite
creator attribution. No seed business labels or defaults to technical enums.

PROPOSED duplicate workflow follows existing durable-rejection semantics instead
of adding accepted get-or-create: after a completed DUP, query the same scoped
catalogue with exactLabel and use the one returned option ID. A rejected key stays
rejected forever. An uncertain add must first resolve its original key; a lookup
alone is not proof of that command's outcome. This works for both roles without
an admin dependency; accepted-reuse was considered in the decision log.

## Original-order queries and projection

Reference lookup has closed body `{orderReference}` with exact same text validation;
it is a query, so no idempotency key or durable command outcome. ID GET validates
the path UUID, rejects query-string/foreign scope overrides and does not search
other factories. Authorize before existence lookup. Missing scoped and foreign
identity return the same 404 `{error:"not-found"}`. There cannot be a valid ambiguous
scoped reference after the proposed unique constraint; corruption is technical
failure, never choose-first behavior.

Both roles receive the same minimum business projection:

- orderId, orderReference, registrationDateJalali, calendar = jalali, lineCount;
- lines in original ordinal order with lineId and position;
- each line's itemNumber if present, materialType `{optionId,label}`, widthM,
  thicknessMm, color `{optionId,label}` if present, ralColorNumber if present,
  lengthM if present, qualityGrade `{optionId,label}` if present, unitWeightKg and
  orderedUnitCount; fixed units metadata m/mm/m/kg.

No principal/request/key/binding, supplier/proforma data, internal lock keys,
mutable stock/progress, technical material category, arrival or driver fields.
ACT-WH gets all ordered specifications needed for comparison, with stable line
IDs and no write operation. DB-created timestamps remain trusted internal metadata;
the entered registration date is not replaced by them.

Use one existing-style READ COMMITTED write-mode transaction for these owner reads,
because current Identity checks lock account/session rows. All source rows are
immutable, so a header visible after commit has its full line bundle and immutable
catalogue references. Recheck authority before disclosure and commit/release before
returning. Do not call current-check locks inside READ ONLY REPEATABLE READ or nest
another pooled transaction. See the transaction/security specifications.

## Catalogue selection query

Closed body `{catalogue, exactLabel?, afterId?, limit?}`. Kind is required;
exactLabel follows the same text identity; afterId validUuid; limit is an integral
JSON number 1–100, default 50 (technical pagination control, not a factory field).
Reject exactLabel combined with afterId. Exact lookup returns zero/one item because
of scoped kind+label uniqueness. General selection sorts by option UUID, keyset
`option_id > afterId`, fetches at most limit+1 and emits items `{optionId,catalogue,label}`
plus optional nextAfterId from the last returned item if more exist. No total count,
global search, unbounded result, creator metadata or locale-equivalence search.
Pages need not form a fixed snapshot across independent calls; committed additions
can appear later. An exact query makes a just-added option immediately selectable.

## Error and recovery semantics

| Condition | Proposed protocol result | Disclosure / effect |
| --- | --- | --- |
| Missing/invalid session | HTTP 401 generic unauthenticated | No existence or business key disclosure |
| Role/scope disallowed at transport | HTTP 403 generic forbidden | No owner read/write |
| Malformed body/unknown route-method pair | 400 invalid / 404 / 405 Allow | No command key consumed; bounds violation never echoes payload |
| Unknown command/version/shape or admission authorization failure | Existing admission-denied; HTTP 403 | No domain execution; existing safe admission audit only |
| Known admitted invalid field/value | completed rejected GUARD_INVARIANT; HTTP 422 | Same-key durable rejection, no partial domain writes |
| Missing/wrong-kind/foreign catalogue | completed rejected GUARD_STATE; HTTP 422 | Same safe scoped error, no foreign ID/label echo |
| New-key duplicate target / catalogue exact value | completed rejected GUARD_IDEMPOTENT_DUP; HTTP 422 | No accepted replay invented; catalogue exact query permits reuse |
| New-key changed target or reused PO reference | completed rejected GUARD_CONFLICT; HTTP 422 | Original source unchanged |
| Scoped key reused with changed full binding/principal | Existing conflict; HTTP 409 | No result from another bound intent/principal |
| Current grant lost at owner lock or replay | Existing actor guard / admission denial as applicable | No stale disclosure or new source writes |
| Technical, lock timeout/deadlock, uncertain COMMIT | Existing technical; HTTP 503, retryable/uncertain as adapter reports | Recover using original principal, scope, key and full command; no fresh IDs/keys |

Binding includes issuer/subject, command/version/target/full canonical payload and
preconditions in the existing scope/key namespace. Actor role and request ID are
not immutable binding components. The same person may replay shared catalogue
creation through either currently authorized role, without changing original creator
metadata. PO registration execution/replay remains PROC-only; WH read authority
cannot disclose its command outcome. Existing recovery fence remains effective;
unavailable admission never implies the command failed or allows key recycling.

Future tests for every operation are specified in the [acceptance plan](I1_PURCHASE_ORDER_ACCEPTANCE_PLAN.md).
No API, policy, shared parser or transport has been changed by this document.
