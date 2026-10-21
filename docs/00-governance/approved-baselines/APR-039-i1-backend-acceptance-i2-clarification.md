---
id: APR-039
title: Formal Owner I1 backend acceptance and bounded I2 business clarification
phase: 12-implementation-planning
status: approved
version: 1.0.0
owners: [project-sponsor]
depends_on: [APR-038, APR-037, IMPL-I1-001, IMPL-I1-TRACE-001, PLAN-INBOUND-DECISIONS-001]
last_reviewed: 2026-10-21
approval: Actual Owner instruction ERP Formal I1 Acceptance and Direct Transition to I2; evidence condition verified
supersedes: null
---

# Formal I1 backend acceptance and I2 clarification authority

Source: actual Owner message **ERP — Formal I1 Acceptance and Direct Transition
to I2**, recorded2026-10-21. Owner accepts implementation commit
`e3462fcfc4eaebbedb0d3a323bda7e0ae72d59c4`, conditional on a lightweight check
that the reported evidence exists and is internally consistent. That condition
was satisfied by the read-only checks below; no new I1 design/audit cycle or full
suite rerun was initiated. This records the actual human acceptance, not an agent
recommendation. **I1 is the twelfth Owner-accepted backend capability.**

## Accepted increment

Procurement-owned immutable pre-arrival operational orders with independent lines,
all twelve purchasing fields (seven mandatory/five optional), exact numeric values,
finite Jalali profile, original-reference preservation and R1 Option A generated
comparison-key uniqueness. Shared exact-label Material Type, Quality/Grade and
Color catalogues remain distinct from technical Inventory classifications.

| Implemented operation / version | Current personal organizational authority |
| --- | --- |
| RegisterOperationalPurchaseOrder v1 | ACT-PROC |
| AddInboundCatalogueOption v1 | ACT-PROC / ACT-WH |
| GetOperationalPurchaseOrderByReference v1 | ACT-PROC / ACT-WH |
| GetOperationalPurchaseOrder v1 | ACT-PROC / ACT-WH |
| ListInboundCatalogueOptions v1 | ACT-PROC / ACT-WH |

Accepted additive [0017 migration](../../../database/migrations/0017_operational_purchase_orders.sql)
creates operational_purchase_order, operational_purchase_order_line and
inbound_catalogue_option, authoritative generated-key uniqueness and deferred
complete-line integrity. Current grants, isolation, full original command binding,
durable outcomes, atomic audit, recovery and immutable sources remain binding.
WH lookup/catalogue addition grants no original-order modification; PROC gains no
stock posting; SEC/customer/unrelated access is not broadened.

The eleven previously accepted capabilities remain preserved: command envelope,
Identity, IPS, Goods Receipt, Sales, reservations, shipment, production, genealogy,
completed-purchase/proforma evidence and issued-invoice evidence. I1 adds no stock,
actual receipt, production, shipment or financial effect.

## Focused evidence verification completed

- Exact commit exists at the inspected HEAD and contains53files. Actual scope
  agrees with [delivery evidence](../../12-implementation-planning/I1_IMPLEMENTATION_STATUS.md):
  Procurement service/value/contracts/store/HTTP plus composition, additive0017,
  tests, necessary tooling and bounded governance. Existing receipt service and
  historical migrations were not changed by that increment.
- The two commands, three queries and composed personal-role policies are present
  in actual code. New inbound contracts contain no I2 arrival/waybill/receiving
  execution, and no later I2 migration is present. Existing legacy manual receipt
  functionality is not misclassified as purchase-linked multi-unit I2.
- [Implementation trace](../../12-implementation-planning/I1_IMPLEMENTATION_TRACE.md)
  contains exactly60unique original IDs:25workflow,23field,12supplemental; I1 and
  deferred I2 remain distinguished. A01–A28 and R1-T01–T12 map to executable tests.
- Existing ignored logs were read, not rerun:184unit PASS;305full integration PASS
  plus5focused PASS, with four overlapping cases and one additional case, hence
  **306distinct PostgreSQL integration cases**. All final logs report zero failed,
  cancelled and skipped. The documented Windows Node24.21.0/npm11.19.0/PG18.6
  commands/results are mutually consistent; no306-case full-run claim is made.
- Delivery records successful build/preflight/lint/format/boundaries and independent
  engineering/security/database review. Required findings I1-REV-01–05 are closed;
  the final independent reviewer also inspected executed log summaries. No required
  finding remains open in the inspected evidence. This task does not claim a fresh
  execution of application/PostgreSQL checks or a new implementation audit.
- Working tree was clean before these documentation changes. No remote push is
  performed or inferred from acceptance.

Local log integrity receipts (logs remain ignored; no credentials are copied):

| Evidence | SHA256 |
| --- | --- |
| artifacts/tests/i1-full-integration.log | 0c4cd7ab10a244ca798bbc895e513aaf2a20dc911ad7290c2ae5cb00f5b90a80 |
| artifacts/tests/i1-final-additional.log | f44418679a07581996210507a3ca5130d1fbfbe0674651af063090e4b7ea444a |
| artifacts/tests/i1-final-unit.log | 9f1d841c50d61b8c41107c8e4f0dac202763da21ca0d80b257bb683d1f47f9d1 |

## Effective next scope and mandatory stop

Prepare the concise Persian [I2 unresolved business decision sheet](../../12-implementation-planning/I2_BUSINESS_DECISIONS_FA.md)
from existing B01/B02–B09 residuals. Confirmed multi-arrival/partial/multi-unit
receiving, eleven receiving fields, W1/W2/W3 meanings, sole IPS, personal WH
receiving and PROC committed-progress visibility are not reopened. All answer
options remain recommendations until the Owner supplies actual decisions.

Only acceptance/governance/status documentation and that decision sheet are
authorized now. No I2 code, migration, executable contract/permission, gate/unlock
change, detailed design or implementation is authorized by this record. After
essential answers, reconcile them into a bounded I2 design for separate approval
and explicit implementation authority; do not restart Steps1/2 or I1 design.

No historical backfill, UI, device integration, Finance, QC or correction expansion.
Backend acceptance is not browser delivery, factory UAT, production deployment or
cutover approval. Stop after reviewed documentation and any coherent local commit;
no push. OQ-011/OQ-019 and unrelated residuals are not blanket closed.

## Acceptance-document recording checks

Proportionate independent documentation/governance/security-boundary review: PASS,
no required finding remains. The reviewer checked actual Owner attribution,
twelve-capability status, historical evidence arithmetic, genuine I2 questions,
unapproved recommendations and the no-I2-authority boundary. One stale B07 wording
was corrected so accepted I1 numeric/date/catalogue choices are not reopened.
This was not another I1 architecture/implementation audit or test execution.

Metadata, local links, sixty-ID coverage and original source/migration preservation
checks PASS, as does working/staged diff validation. Changes for this task are
Markdown only; executable sources, tests, migrations, security and gate/unlock
controls remain unchanged. Final local commit and current remote-read result are
reported separately after recording; no push is part of the task.
