---
id: REVIEW-STOCK-RESERVATION-001
title: Reservation independent review closure
status: accepted
last_reviewed: 2026-10-08
---

# Independent reviews

Domain/engineering/database/test reviewer did not author changed source. Separate security/API/database reviewer did not author source/tests. Author-agent self-checks are not counted as independent acceptance. Both inspected actual changed source and relevant canonical sources; neither claimed PostgreSQL execution. Root runs fresh Windows isolated PG acceptance.

## Required findings and resolution

1. Historical earlier order Unit selection initially blocked stock indefinitely even when fully ACTIVE-covered elsewhere. Sales now returns minimal exact-time earlier item evidence; Inventory counts matching actual ACTIVE claims. Fully covered earlier items no longer block free Units; partial/REQUESTED-only coverage keeps priority. Real PG full/partial regressions added. No cross-owner SQL or foreign order lock cycle.
2. Initial Warehouse unscoped GetReservation/allocated Unit reads contradicted customer isolation. GetReservation is Sales-only exact customer; Warehouse retains target-bound activation and action result. Organizational Unit/Lot reads deny RESERVED, foreign reserved availability denied via real claim customer. Source rechecks and negative API tests added.
3. Test setup/assertions initially reused a foreign rejected key then expected owner acceptance, or expected business completion for envelope unknown-field admission. Corrected fresh negative keys, exact conflict/admission families, accepted setup proof and raw HTTP framing so tests reach the intended guard.

Source rechecks PASS for current branded permission, action/object/replay isolation, IPS-only quantity write ownership, parameterized SQL, immutable request+matching claim constraints, lock order, priority, transaction/audit boundaries and bounded transport. No known critical/high or unresolved required source defect. Final live proof remains mandatory before acceptance.

Later/deferred: release/consume/cancel coverage synchronization, browser/UI/hosting/TLS surfaces, measured priority scaling and Windows DB CI. They do not imply permission to implement these now.

## Final acceptance evidence

Independent engineering/domain/database/test and separate security/API/database source/document rechecks PASS after all corrections. Both reviewed actual staged source/docs and git diff --cached --check; neither authored product fixes nor represented parent DB runs as independent live execution. No required finding remains.

Root fresh Windows npm run verify PASS98unit/147realPGintegration, zero failures/skips. Exact final staged LF migration install/sequence/checksum plus reservation/API32-test rerun PASS. Build/typecheck, lint, format, boundary84files and documentation/JSON/reference checks PASS; registry audit0 known vulnerabilities. Version/scripts/prior7migrations unchanged; business OQs unchanged.

Earlier failed test expectations are corrected and passing: unknown fields are envelope admission denial, cross-principal accepted-key reuse conflict, revoked replay denial audits one attempt, and raw duplicate-header probe includes valid Host/framing to reach the actual application guard. Accepted setup is asserted rather than assumed. Full/partial coverage, foreign reserved queries, microseconds, tied timestamps and confirmation-lock race regressions pass.

This is engineering acceptance of the bounded increment, not fabricated factory UAT/release approval. Stop after coherent local commit for Owner review/push.
