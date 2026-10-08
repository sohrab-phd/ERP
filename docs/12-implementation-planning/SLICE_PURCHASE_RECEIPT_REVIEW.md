# Receipt increment — independent review closure

2026-10-08. Actual scope/policy: APR-021; technical decision ADR-0016.

Independent reviewers examined code they did not author. Engineering/database/
domain/readiness reviewer and security/API reviewer performed static source and
regression review; no concurrent fixture reset or independently executed database
test is claimed. Root executes the complete Windows/PostgreSQL suite.

| Finding | Class | Closure |
| --- | --- | --- |
| Same-account concurrency tests were serialized by Identity rather than proving owner locks | Required test improvement | Two separate Warehouse accounts/persons/sessions and bounded two-party barriers before actual Receipt/Sheet owner-lock paths; real PostgreSQL regressions |
| Production HTTP/composition was absent from internal service test proof | Required test improvement | Real composed HTTP command/read/replay/role/header/body/revocation/fence tests |
| New migration absent from frozen runner inventory and legacy test expected five | Required improvement | Register0006; fresh/repeat/concurrent/checksum/failure-restart assertions expect six |
| Missing injected receiving policy used an invalid free-form open-item marker | Required contract correction | Existing OQ-019 marker obeys canonical GUARD_OPEN_POLICY format; missing permission/configuration injection rejects durably. Owner-resolved normal manual policy is active, named grants remain config/Go-Live |
| Isolation prose contradicted existing org-scoped mill-stock rule; API/security docs retained stale lock snapshot | Documentation inconsistency | Narrow customer-owned vs unallocated mill distinction and links to effective canonical scope; no broad customer permission |
| APR-021 label still said pending business checkpoint | Documentation inconsistency | Actual Owner clarification recorded; no broader OQ closure |
| Tests expected no audit for denied admission and omitted explicit open-policy evidence | Required test correction | Exact AUD-ISOLATION-DENY/AUD-CMD-ADMISSION-DENIED/AUD-OPEN-POLICY/rejection/replay rows asserted; zero business effects still required |

Withdrawn false positives are not implementation changes: canonical command keys
are lowercase UUID-v4 (not arbitrary strings); stored receipt UUID key remains
correct, with non-UUID admission-denial regression. Exact pinned Node quantity
regexes reject final newline; executed negative unit checks confirm this.

Security/API static review: PASS, no remaining blocking/required findings.
Engineering/database/domain/readiness static review: pending final execution and
actual delivery-document recheck. Final live evidence/DoD is in the
[implementation status](SLICE_PURCHASE_RECEIPT_IMPLEMENTATION_STATUS.md).

No browser/files/outbound HTTP or new dependency surface is introduced. Future
UI, device/source references, discrepancy/returns/PO, opening stock and recovery
automation remain deferred at their actual dependent scopes, not fabricated
manual-intake blockers. No malicious-agent/OS containment objective is revived.
