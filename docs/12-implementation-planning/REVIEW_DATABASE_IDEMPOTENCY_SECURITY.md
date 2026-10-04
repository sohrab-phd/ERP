---
id: PLAN-REVIEW-DATABASE-IDEMPOTENCY-SECURITY-001
title: Database, idempotency and application security engineering review
phase: 12-implementation-planning
status: reviewed
version: 1.0.0
owners: [database-idempotency-security-reviewer]
depends_on: [ADR-0011, PLAN-COMMAND-IDEMPOTENCY-001, DATA-TX-001, SEC-AUD-001]
last_reviewed: 2026-10-04
approval: null
supersedes: null
---

# Database, idempotency and application security review

Independent engineering perspective from agent canonical_idempotency. This
reviewer also authored the repairs/ADR, so its post-repair self-check is not
represented as a separate independent acceptance. The parent final readiness
review must inspect the resulting contracts independently. No application code,
migrations or live database tests were executed.

## Evidence actually read

Current decision/OQ/phase registers and README; module ownership; posting kernel,
transaction/idempotency, logical model/attributes/enforcement/genealogy/cutover;
API, orchestration and command catalogue; transition tables, invariants,
interlocks and rejection catalogue; identity, RBAC, customer isolation, audit,
threat model/security verification; test strategy/property intents; recovery;
new command spec, earlier draft/concurrency and physical design.
Repository reads work after hook reload; previous access-gap claims in these
owned current documents were removed, rather than treating denied-source drafts
as evidence. Historical approval snapshots are retained.

## Observed findings and resolution

| Classification | Observed issue | Resolution/evidence |
| --- | --- | --- |
| Implementation-start blocker — resolved | ORCHESTRATION stored idempotency result AFTER business success/event emission, leaving committed fact without durable outcome | ADR-0011/spec + ORCHESTRATION + DATA-TX-001 place facts/outcome/original audit in one commit; notices afterwards |
| Implementation-start blocker — resolved | Earlier draft principal-in-key namespace and EVENT per-command scopes allowed another principal/command to use same scoped key independently | One installation/authority/key PK; principal/command/target/material separately bound; mismatch nondisclosing conflict; old draft superseded |
| Implementation-start blocker — resolved | Old generic prose covered accepted retries while API also described rejected replay without durable algorithm | Terminal ACCEPTED and REJECTED stored/replayed equally; same-key rejected guard never reevaluated |
| Documentation inconsistency — resolved | GUARD_IDEMPOTENT_DUP described already-accepted command, conflating successful replay with rejection | EVENT/ADR/spec distinguish successful same-key replay, different-key semantic duplicate and key conflicts; preserve production new-key GUARD_CONFLICT |
| Implementation-start blocker — resolved | Spec unique PENDING claim and physical advisory terminal row were conflicting mechanisms | One READ COMMITTED xact advisory lock + separate SELECT, terminal-only INSERT/full PK; no claim/lease/deferred incomplete row |
| Implementation-start blocker — resolved | Request identity lacked fully frozen canonical/version/limits/current access contract | Spec freezes UUIDv4, issuer/subject binding, typed target/preconditions, exact canonical bytes+hash, bounds, retained readers and post-lock permission decision |
| Implementation-start blocker — resolved | Deterministic rejection after tentative writes and technical SQL failures could poison key or commit effects | Savepoint before handler; rollback tentative effects before reject/audit; infrastructure classes precede known business mappings and abort whole transaction |
| Implementation-start blocker — resolved | Audit/outcome insertion/links and replay attempts were not consistent | Original audit first, outcome matching FK, one original decision, separate durable replay/conflict/admission audits; canonical taxonomy explicitly extended |
| Implementation-start blocker — resolved | Crash/unknown COMMIT/restore absence could permit fresh execution | Same-key primary resolution; no replica/new-key/auto compensation; restore admission disabled with lost-history reconciliation |
| Documentation inconsistency — resolved | DB sources required numeric Residual cutoff despite current human reusability evidence | Human Production/Workshop Manager disposition, no automatic weight/dimension classifier; recording/return contract stays Class B/OQ-009 |
| Documentation inconsistency — resolved | DB mass-balance borrowed answered OQ-006 default-zero fulfillment tolerance | Production loss/mass-balance policy remains Class B live production evidence; no invented threshold or numerical factory answer |
| Documentation inconsistency — resolved | DB labels called ten Station/Step names unknown and batch Quality Released current requirement | Recorded Station names retained; route/version/lifecycle residual only; no current-MVP QC/release actor |
| Documentation inconsistency — resolved | Security current labels said OQ-013 site unanswered and portal reads outside MVP | Recorded one entity/site, visibility-only Sales-owned approved-whitelist reads; real identity/permissions/doc list before portal slice, no new business authority |
| Documentation inconsistency — resolved | Wire contract_version versus physical command_version could imply separate version identity; concurrency retained optional omitted installation | Explicit wire-to-column mapping; mandatory three-column UUID PK with no dedicated-database exception |
| Non-blocker — preserved | Actual people/RBAC assignments, receipt/device fact identity and business decimal scale | Required before corresponding identity/domain/device slices; first envelope uses test-only fixture context and no domain arithmetic |
| Future/deferred concern — preserved | Backup product/retention, production recovery fence, external outbox, multi-site and future Quality | Go-Live/recovery/integration or later ADR prerequisites; not false envelope-start blockers |

## Result and proof limits

No unresolved generic database/idempotency design blocker remains in the owned
reconciled contracts. Accepted technical design under delegation is not a human
implementation baseline approval. Runtime role/table constraints are ordinary
application design, not OS adversarial containment. No inventory quantity writer,
business rule, OQ status or human approval evidence is added.

The new physical design's full tuple/immutable terminal rows, original-audit
matching link and explicit savepoint/primary retry agree with ADR-0011.
Future implementation must prove the acceptance cases using real PostgreSQL:
parallel connections, lock waits and fresh snapshots, rejected-write rollback,
current authorization after wait, audit failure, lexical canonicalization,
crash/unknown commit, retained replay readers and disabled admission after lossy
restore. Mocks alone are insufficient; these tests do not exist/pass yet.

Documentation/static check: git diff --check passed after these repairs.
Final source/link/JSON/register/Git verification and independent final review
are performed at repository level, not asserted by this narrow review.

ERP implementation remains locked. No gate/unlock/approval edits or product files.
