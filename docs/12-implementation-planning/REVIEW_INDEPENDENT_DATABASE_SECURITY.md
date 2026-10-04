---
id: PLAN-INDEPENDENT-DATABASE-SECURITY-001
title: Independent database, idempotency and application-security review
phase: 12-implementation-planning
status: reviewed
version: 1.0.0
owners: [independent-database-security-reviewer]
depends_on: [ADR-0011, ADR-0013, PLAN-COMMAND-IDEMPOTENCY-001, PLAN-ENVELOPE-PHYSICAL-001, SEC-AUD-001]
last_reviewed: 2026-10-04
approval: null
---

# Independent database, idempotency and application-security review

Reviewer: independent_database_security, separate from canonical_idempotency,
the technical/physical design author and the parent readiness coordinator.
This reviewer changes this review file only. Source reconciliation findings
were sent to the coordinator for correction and independent reread.
No product code, SQL migration, database, dependency or authorization artifact
was created, and no live product acceptance test was executed.

## Sources actually inspected

Current README, CURRENT_PHASE, decision/OQ registers; ADR-0011 v1.0.0,
ADR-0013 v0.1.0; COMMAND_IDEMPOTENCY_SPEC v1.0.0; concurrency reconciliation;
TECHNICAL_FREEZE and SLICE_ENVELOPE_PHYSICAL_DESIGN v0.2.0.
Canonical ownership/module-dependency maps; posting kernel, logical model and
attributes/enforcement, DATA-TX-001 v0.4.0 and retention/cutover; API_ENVELOPE v0.3.0,
orchestration/command catalogue; interlocks/rejection catalogue; current identity, role matrix,
customer isolation, audit taxonomy, threat model and security verification;
test strategy/property intents and backup/recovery. Read-only canonical gate
inspection confirmed false/null and Test-Path confirmed final unlock absent.

External primary-source checks support the concurrency analysis: PostgreSQL
[READ COMMITTED snapshots](https://www.postgresql.org/docs/18/transaction-iso.html)
explain the required separate statement after a lock wait;
[transaction advisory locks and savepoint lock lifetime](https://www.postgresql.org/docs/18/explicit-locking.html)
support locking before handler work; node-postgres requires
[one client for each transaction](https://node-postgres.com/features/transactions).
Exact publisher version-pin research is recorded by the tooling author/reviewer,
not independently re-certified by this narrower review.

## Findings and classification

| Classification | Finding | Verified disposition |
| --- | --- | --- |
| Documentation inconsistency — resolved | Physical envelope used command_version while APP-ENV-001 freezes contract_version | Independently reread physical v0.2.0: exact request field contract_version maps one-to-one to persisted command_version, no second field |
| Documentation inconsistency — resolved | Concurrency reconciliation permitted omitting installation_id in a dedicated database, unlike spec/physical freeze | Independently reread: all three UUID columns mandatory even in dedicated database; claim-row alternative withdrawn |
| Documentation inconsistency — resolved | SEC-ID-001 site_scope open/unconfirmed OQ-013 and SEC-ISO-001 stale portal possibility | Independently reread SEC-ID-001 v0.3.0 and SEC-ISO-001 v0.3.0: answered one-site/entity, trusted scope and isolated visibility-only reads, no new tenants |
| Documentation inconsistency — resolved | SEC-RBAC-001 denied MVP portal reads and SEC-VER-001 treated answered site/portal scope as unanswered | Independently reread SEC-RBAC-001 v0.4.0 and SEC-VER-001 v0.4.0: current ACT-CUST isolated Sales-owned reads conditional on explicit later whitelist; future second site reopens architecture |
| Non-blocker | Human role assignments/auth provider are not selected | Health-only host has no business/fixture routes; later identity capability must supply verified personal identities and command/customer permissions before business exposure |
| Non-blocker | Runtime executable acceptance tests do not yet exist | Their detailed requirements are first-slice Definition of Done after human authorization, not an excuse to claim tests passed now |
| Slice-specific later decision | Owner natural-fact keys, resource lock order, receipt identity, production decimal scale and SoD evidence | Freeze before owning business/device slice; advisory key locks do not substitute for those constraints |
| Go-Live/recovery input | Backup product/retention and durable post-restore fence implementation | Accepted RPO/RTO retained; recovered history cannot enable old uncertain intent without reconciliation |
| Future/deferred | Outbox/inbox, multi-site, QC, portal ordering and legal GL | No external effects or those domain capabilities in foundation; explicit later change required |

The first four observed source inconsistencies were repaired by the coordinator
and independently reread by this reviewer on 2026-10-04. They did not invent
factory answers, add a new OQ or create adversarial containment requirements.
No unresolved implementation-start blocker remains within this review scope.

## Red-team analysis of the actual design

| Attempt to invalidate readiness | Static result and required implementation proof |
| --- | --- |
| Retry changes command, version, principal, target, precondition or material fields | Full tuple locates immutable winner; bound content comparison yields nondisclosing conflict; no alternate principal/command namespace or handler call |
| Cross-customer/principal reuse or revoked access after waiting | Trusted context derives identity/scope; current permission/result visibility checked after wait; original result never returned from historic authority alone |
| Duplicate accepted or rejected execution after restart | Both terminal kinds stored durably; matching replay bypasses handler/guard reevaluation and retains original execution |
| Concurrent waiter reads an old snapshot and runs twice | Transaction advisory lock precedes separate SELECT, giving fresh READ COMMITTED visibility; full tuple PK is final backstop |
| SHA collision identifies unrelated payload/key as equal | Advisory collision only serializes; full tuple and exact canonical bytes plus digest determine identity |
| Recognized rejection follows tentative SQL writes | SAVEPOINT precedes handler; rollback removes tentative effects, then rejection/outcome/audit commit together |
| Deadlock/timeout is cached forever as business rejection | Infrastructure classifications precede registered constraint mappings; whole transaction abort leaves no terminal row |
| Every unique constraint error is guessed to mean duplicate | Explicit owner mapping and authorized matching-fact verification required; Production new-key completion remains CONFLICT, not generic DUP |
| Original audit row belongs to another execution/key/principal/kind | Nonnull outcome fields and matching composite FK bind original decision; unique original execution index prevents two originals; audit-first insertion avoids cycle |
| Audit outage permits unaudited first success or replay disclosure | First outcome/facts roll back; attempt audit must commit before replay/conflict delivery; original winner preserved if attempt audit fails |
| COMMIT succeeds but acknowledgment/response is lost | Uncertain result; destroy uncertain client; same bound key resolves through primary lock/lookup, never new key or replica absence |
| Restore is consistent but acknowledged row was lost | Command admission fenced until reconciled; absence is not nonexecution proof; no exactly-once promise across unreconciled loss |
| Payload includes secrets, duplicate JSON names, unknown fields or huge nesting | Bounded registered admission rejects before key consumption/storage; lexical scalar/canonical bytes rules and redacted audits/logs have concrete acceptance cases |
| Handler commits independently, writes foreign module or emits irreversible effect | Opaque transaction ports, owner-only adapters and no raw pg/pool access; no external effect before commit; no domain posting in foundation |
| Test reset accidentally targets production | Separate acknowledged _test database, identity/role/server checks, NODE_ENV=test and runtime-URL separation precede schema mutation; reset limited to kernel/envelope_test |
| Production exposes synthetic identity or fixture command | Production registry empty and health-only composition; test contexts/handlers live only in test harness; acceptance must verify absence |
| Retained old decoder accidentally permits obsolete new executions | Final spec explicitly separates active execution contracts from retained replay-only readers; absent old-contract key is refused, existing authorized outcome can replay |
| Runtime mutates/deletes dedup/audit history | Normal least-privilege DML role has no UPDATE/DELETE/TRUNCATE/DDL/role management; migration login separate; permission-negative tests required |

This is useful application/database static reasoning, not a penetration-test
execution or proof against a malicious Codex process. The static design preserves
Modular Monolith ownership, one PostgreSQL transaction/client, ACT-IPS sole
quantity writer and atomic Production bundles. No quantities, domain posting or
new inventory authority are introduced by foundation.

## Final verdict and review limits

PASS — static database, idempotency, concurrency/crash and application-security
design readiness for foundation SLICE-ENVELOPE. All observed review findings
above are resolved and independently reread. Physical v0.2.0, technical v0.2.0,
spec/ADR-0011 v1.0.0 and ADR-0013 v0.1.0 form the inspected foundation contract;
the revised SEC sources and full-tuple concurrency text were included in reread.
EVENT_AND_REJECTION now explicitly places irreversible notices after confirmed
COMMIT, not merely after successful SQL statements. git diff --check passed.

This PASS is an independent technical-design verdict within the stated review
scope. It is not human baseline approval, final authorization, a production
security certification or a claim nonexistent executable tests passed. The
coordinator must separately finalize register/source/Git checks, tooling evidence
and independent whole-project readiness. No OS containment proof is required.

Acceptance after unlock must use real PostgreSQL with independent clients,
deterministic barriers and known test descendants: accepted/rejected replay,
binding/principal conflicts, fresh-snapshot waits, predecessor rollback,
savepoint/constraint handling, audit failure, true unknown COMMIT, restart,
current-access revocation, migration/reset privileges and lossy-restore fence.
Mocks are useful for ports; they cannot certify PostgreSQL race/crash behavior.

ERP implementation has not begun. implementationAuthorized=false,
approvedBaseline=null, final implementation unlock absent. No human approval
or baseline acceptance is manufactured by this review.
