---
id: SRC-006
title: Owner-approved R1 Option A purchase order reference equivalence
phase: 12-implementation-planning
status: recorded
version: 1.0.0
owners: [project-sponsor, business-process-owner]
depends_on: [SRC-004, SRC-005, APR-035]
last_reviewed: 2026-10-21
approval: Actual Owner explicitly approves R1 Option A business equivalence only
supersedes: null
---

# SRC-006 — Subsequent Owner R1 decision, original evidence unchanged

Provenance: actual Owner message “ERP Purchase & Receiving — Final R1 Decision and
I1 Design Acceptance Preparation,” recorded2026-10-21 after review of local
`a84e20e12c7cd0b301e329d0ed97f300029b9aba`. Push is not confirmed. This is a
subsequent clarification, not evidence collected during the earlier factory visit.
SRC-004/SRC-005, the23fields,25workflow rules and S01–S12 remain unchanged.

The Owner formally approves R1 Option A: retain exact entered seller PO reference;
use a separate deterministic comparison key for factory-wide identity and lookup.
Raw reference, comparison key, technical PO UUID and durable command identity differ.
The accepted current factory-to-installation mapping remains the architectural basis.

| Source rule | Approved PO comparison equivalence | Explicit boundary |
| --- | --- | --- |
| R1-A | Ignore leading/trailing ordinary U+0020 SPACE | No internal collapse, tab/NBSP/zero-width/other-whitespace equivalence |
| R1-B | Ignore case of ASCII Latin A–Z | No locale-dependent or unrestricted Unicode case folding |
| R1-C | Corresponding U+0030–0039, Persian U+06F0–06F9 and Arabic-Indic U+0660–0669 digits equivalent | Preserve raw characters and leading zeros; no numeric parsing |
| R1-D | Persian Yeh U+06CC equals Arabic Yeh U+064A; Persian Kaf U+06A9 equals Arabic Kaf U+0643 | No other substitutions |

Preserve and return the original entered reference without replacing/normalizing
it. No silent historical reference change or automatic link to completed purchases.
Keep punctuation/separators/internal whitespace/leading zeros/zero-width characters
and all unapproved Unicode differences significant. No fuzzy/compatibility matching,
arbitrary first result, supplier namespace, extra equivalence or catalogue rule.

The same approved comparison must govern duplicate detection, DB uniqueness,
concurrent conflicts, lookup, owner locks and source validation. Equivalent raw
references cannot create separate operational POs in one installation. Approved
variant lookup retrieves the authorized original; non-equivalent variants do not.
Original full command payload binding/replay remains unchanged: business equivalence
does not make changed command intentions identical.

Authority is documentation reconciliation/acceptance preparation only, including
a precise proposed technical normalizer/DB strategy, test obligations,14decision
checklist, bounded future implementation-authorization DRAFT, independent review,
checks and optional local commit. R1 alone is approved. Other technical decisions,
limits/calendar/catalogue/DB mechanism are not automatically accepted. No source
code, executable SQL/contracts/permissions/tests/gate/unlock, I2 or push authorized.
Stop for Owner design acceptance and separate implementation instruction. Eleven
accepted backend capabilities remain. See [APR-036](../approved-baselines/APR-036-r1-design-acceptance-preparation.md).
