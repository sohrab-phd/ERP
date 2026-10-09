---
id: REVIEW-STOCK-SHIPMENT-001
title: Shipment independent review closure
status: accepted
last_reviewed: 2026-10-09
---

# Independent review and required corrections

Initial independent engineering and security reviewers identified the required corrections below. Final independent reviewer covered engineering/domain/database/API/test and security together after the fixes, authored no implementation and executed no DB tests. Static source review PASS and root-executed Windows PostgreSQL proof are separate evidence; author self-checks are not independent acceptance.

1. READY originally admitted a partial-disabled incomplete line and froze invalid contents. Required guard moved before READY and repeated at dispatch; regression proves rejected READY remains DRAFT, missing whole Unit can be attached, then successful dispatch.
2. Initial test expected a single DRAFT intent per Unit and invented an invalid envelope status. Corrected proof targets active packed ownership and actual admission/conflict/business-rejection families, including valid changed-key binding inputs.
3. Required transaction/race proof: five injected write-window failures, same-key retry, observed advisory-lock contention for packing/unpacking/dispatch versus reservation activation, audit outage and lost COMMIT response; final real PostgreSQL proof PASS.
4. Required security proof: copied/forged contexts, direct IPS effects without instance admission, foreign objects/current-grant replay, immutable package/content/dispatch/consumed history and runtime privileges; final real PostgreSQL security proof PASS.
5. Canonical READY policy reconciled with the actual APR-024 Owner answer; package assignment uses existing PackageAssigned event. No unapproved delivery, finance, physical split, Sales fulfillment or closure.

Final engineering and security source review PASS after correction; fresh full npm run verify107 unit +173 real PostgreSQL tests PASS, zero failures/skips. All required findings closed; no known high/critical defect. One existing Inventory regression was corrected to assert exact audit-family/execution/key provenance without assuming UUID chronology for equal timestamps; the independent reviewer inspected that fix. Migration0009 explicit nonnull wording for CONSUMED could improve clarity, but INSERT/transition guards already prohibit a null consumed claim, so this is low-severity nonblocking defensive clarity. Unchanged-lock October8 zero-vulnerability audit is historical; fresh metadata upload was denied by automatic tool review, not a fresh audit PASS. Deferred surfaces include customer delivery/exception/return, UI/TLS deployment, Windows DB CI and production prerequisites; they are not shipment features.
