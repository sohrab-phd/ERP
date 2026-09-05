---
id: DOM-P03-HANDOFF-001
title: Phase 02 to Phase 03 Handoff
phase: 02-domain-business-architecture
status: approved
version: 0.1.1
owners: [chief-solution-architect]
depends_on: [DOM-MVP-RULES-001, DOM-PROCESS-001, DOM-OWN-001, GOV-STATES-001, ASM-014, ASM-015]
last_reviewed: 2026-09-06
approval: APR-004
supersedes: null
---

# Phase 02 to Phase 03 Handoff

This is a Phase 02 design artifact. It does **not** start Phase 03. Phase 03
stays `planned` until the Project Owner approves Phase 02 and a checkpoint
exists.

Team answers are expected in a few days (ASM-015). They are **not** required
to begin Phase 03 *structure* after that approval. They **are** required before
Phase 03 can close numeric guards or owner-signed policy.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Inherit from Phase 02

- Bounded contexts and forbidden writes:
  [CAPABILITY_BOUNDED_CONTEXT_MAP.md](CAPABILITY_BOUNDED_CONTEXT_MAP.md)
- Happy path and named exceptions:
  [PROCESS_MAPS_AS_IS_TO_BE.md](PROCESS_MAPS_AS_IS_TO_BE.md)
- Actors and proposed RACI:
  [ACTOR_RESPONSIBILITY_CATALOGUE.md](ACTOR_RESPONSIBILITY_CATALOGUE.md)
- One write owner:
  [MODULE_OWNERSHIP_MATRIX.md](MODULE_OWNERSHIP_MATRIX.md)
- Proposed BR-001 through BR-020:
  [MVP_SCOPE_AND_BUSINESS_RULES.md](MVP_SCOPE_AND_BUSINESS_RULES.md)
- Proposed lifecycles: [GOV-STATES-001](../00-governance/registers/STATE_TRANSITION_CATALOGUE.md)

## What Phase 03 may draft after Phase 02 approval, before team answers arrive

Draft structure only. Leave every OQ-owned number, name, or cutoff as an open
guard. Do not invent values.

| Draft | Allowed now | Must stay open until an answer |
| --- | --- | --- |
| Per-aggregate state lists from SM-* | Yes, as proposed | Official routing steps (OQ-003); batch vs piece (OQ-004) |
| Transition table: from, to, command, actor role | Yes, using ACT-* roles | Named approvers (OQ-005, OQ-019) |
| Guards that are already non-numeric rules | Yes (BR-001, BR-003, BR-004, BR-005, BR-009, BR-013, BR-014, BR-016, BR-017, BR-018, BR-019, BR-020) | UOM/precision (OQ-001), Coil weight vs length (OQ-002), QC limits (OQ-005), tolerances (OQ-006), closure (OQ-007), reservation expiry (OQ-008), residual cutoff (OQ-009) |
| Quality/Shipping command Inventory; do not write stock | Yes (BR-017) | Exceptional-release person (OQ-005) |
| Goods Receipt split | Yes (BR-018) | Opening-stock cutover RACI (OQ-015) |
| Genealogy Link as projection | Yes (BR-019) | Tracking granularity (OQ-004) |
| Correction = reversal, not delete | Yes (BR-005, ASM-006) | Cutover and recovery numbers (OQ-015, OQ-016) |
| Portal ordering out of MVP | Yes (BR-020) | Later portal actions (OQ-010) |
| Inventory Posting Service as unique stock writer | Yes as a proposed pattern | Mechanism (OQ-017) |
| Side-effect matrix of *which* BC is commanded | Yes | Numeric mass-balance tolerance (OQ-006, BR-007) |

## Proposed lifecycle seeds Phase 03 will expand

Do not treat these as executable machines yet.

| Machine | Happy path already proposed | Open answers that fill guards |
| --- | --- | --- |
| SM-SALES-ORDER | Draft through Closed | OQ-006, OQ-007, OQ-008 |
| SM-PURCHASE-ORDER | Draft through Closed | workshop commercial practice |
| SM-GOODS-RECEIPT | Draft → Received → QC hold → Posted | OQ-005, OQ-015 |
| SM-PRODUCTION-ORDER | Draft through Closed | OQ-003, OQ-005, OQ-009 |
| SM-INVENTORY-UNIT | Pending QC through Consumed / Shipped / Scrapped | OQ-001, OQ-002, OQ-005, OQ-008 |
| SM-QUALITY-INSPECTION | Planned through disposition | OQ-005 |
| SM-SHIPMENT | Draft through Closed | OQ-006 |
| SM-INVOICE | Draft through Paid / Voided | OQ-007, OQ-012 |

Also required in Phase 03 and not yet a named SM-* seed: Inquiry, Quotation,
Unfulfilled Demand, Reservation, Residual, Scrap, Package, Payment. Add those
machines from Phase 02 concepts without inventing extra commercial policy.

## BR-* to INV-* promotion rule

Phase 03 may assign `INV-*` IDs to BR-001 through BR-020 **only** as proposed
invariants. A row that depends on an unanswered OQ must keep an explicit
extension point. It must not gain a invented number, person, or cutoff.

## Must not do in this handoff or before Phase 02 approval

- Start Phase 03 artifact drafting as if the phase were active
- Close or answer OQ-001 through OQ-019
- Treat Temporary \* (temporary) identities as transition approvers
- Accept ADR-0006, ADR-0007, ADR-0008, or any package
- Write schemas, APIs, or application code
