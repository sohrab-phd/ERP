---
id: SEC-AUD-001
title: Audit and Evidence Taxonomy
phase: 06-security-rbac-audit
status: in_review
version: 0.4.0
owners: [security-architect, business-control-owner]
depends_on: [SM-EVT-001, APP-ENV-001, DATA-TX-001, APR-007, APR-008]
last_reviewed: 2026-10-10
approval: null
supersedes: null
---

# Audit and Evidence Taxonomy

APR-008 remains historical structure approval. This delegated ADR-0011 technical
extension adds explicit conflict/admission attempt kinds and atomic storage;
it is not human baseline approval.

What must be retained as security and correction evidence. Retention
day-counts stay OQ-016. This is not a SIEM or logging package
(OQ-018).

Current Identity implementation is authorized by APR-019. The following canonical
AUD-CMD-* families remain unchanged; foundation-era authorization statements are
historical snapshots.

## Delivered Identity security events

[ADR-0014](../00-governance/adrs/ADR-0014-local-identity-authorization.md) adds
append-only `identity.security_event`, atomically owned by Identity lifecycle and
security-administration procedures. Kinds: LOGIN_ACCEPTED, LOGIN_DENIED, LOGOUT,
SESSION_REVOKED, ACCOUNT_CREATED, ACCOUNT_DISABLED, GRANT_CHANGED, PASSWORD_CHANGED.
These supplement command audit, not substitute for canonical AUD-CMD-* evidence
or a business outcome. LOGIN_DENIED records failed authentication without
inventing a bound actor or storing the submitted username/credential. Person
attribution and DB timestamp are retained when verifiable; grant changes include
role/authority/customer/enabled metadata only. No token/hash/password is stored.
Runtime may insert/read but never update/delete these events. Failed event insert
rolls back the corresponding account/grant/session write. Throttled traffic has
no credential evaluation or durable business outcome. Retention remains OQ-016.

## Evidence kinds

| Kind | When written | Mutable? |
| --- | --- | --- |
| `AUD-CMD-ACCEPTED` | Command accepted; includes command name, key, actor, fact identity, states | no — reversal is a new command |
| `AUD-CMD-REJECTED` | Command rejected; includes family and `open_item` if `GUARD_OPEN_POLICY` | no |
| `AUD-CMD-REPLAYED` | Same key returned the first result | no |
| `AUD-CMD-CONFLICT` | Occupied scoped key mismatched bound intent/principal; safe attempt evidence, no second original outcome | no |
| `AUD-CMD-ADMISSION-DENIED` | Malformed/unbounded/unknown/unbindable request refused before key admission; safely bounded attempt evidence | no |
| `AUD-SOD` | Second human recorded on a sensitive command | no |
| `AUD-REVERSAL` | Compensating command linked to the original fact (INV-005) | no |
| `AUD-OPEN-POLICY` | Rejection because an OQ or `workshop-commercial-practice` was required | no |
| `AUD-ISOLATION-DENY` | Query or notice blocked for customer/scope | no |
| `AUD-AUTHN-FAIL` | Principal could not be bound | no — no posted fact |
| `AUD-ACTOR-TEMP` | Temporary identity attempted a command | no |

Posted commercial documents and Ledger rows remain the business
evidence. These `AUD-*` rows explain who commanded, who authorized,
and why a command was refused.

## Conflict rules

- A rejected command is not a reversal.
- A reversal is `AUD-REVERSAL` plus a new `AUD-CMD-ACCEPTED`.
- Genealogy and Balance rebuilds do not create `AUD-CMD-ACCEPTED`
  stock facts. They may record a rebuild notice that is not source
  truth.
- Finance-Lite audit is not legal-GL evidence (OQ-012).
- Opening-stock cutover evidence later requires OQ-015 names; until
  then cutover commands reject as `GUARD_OPEN_POLICY`.

## Minimum fields

| Field | Required on |
| --- | --- |
| `occurred_at` | all |
| `actor_identity` / `actor_role` | all except failed bind |
| `command` or `query` | all command/query evidence |
| `idempotency_key` | all commands |
| `family` | rejections |
| `fact_identity` | accepted writes |
| `linked_fact` | reversals |
| `customer_scope` | customer-bearing items |

For APR-028 issued-invoice documentary evidence, the authorized actor grant is
organizational. Generic command audit retains that original organizational grant
scope without fabricating a customer-scoped principal. The accepted fact UUID
links to the same-transaction immutable Finance-Lite record with its mandatory
owning customer/Sales order and installation/authority. Audit carries no invoice
reference, date or customer commercial payload; document lookup still requires
the explicit invoice-evidence role policy. ACT-SEC audit administration does not
grant invoice-document access. This bounded association does not widen any
other customer-bearing audit/export/notification surface.

Generic decision/attempt storage is frozen below. Later log shipper/SIEM product
choice remains OQ-018.
For SLICE-ENVELOPE ADR-0011 selects append-only PostgreSQL `kernel.audit_event`
in the owning transaction, with execution/attempt UUIDs, installation/authority
scope, trusted issuer/subject, original actor role/customer scope when relevant,
command and allowlisted safe metadata. Original accepted/rejected execution
audit commits atomically with complete terminal outcome and owner facts. Outcome
references the matching original audit; exactly one original decision per execution.
Replay/conflict attempts are separate, never another original decision. Their audit
commit precedes response; failed/uncertain audit is technical failure. Original
outcome remains unchanged. No circular outcome↔audit insert dependency is needed.
Security/admission events have no outcome and may lack identity/command/key when
unverifiable. Never fabricate those fields or disclose foreign references.

The quoted open storage label applies to later log shipping/SIEM products only;
foundation decision-audit persistence is now frozen. No full material request,
saved response, token, credential, SQL or connection string enters safe_details.
Deduplication outcome/binding retention has no automatic TTL; audit retention
days stay OQ-016 and cannot silently permit old command reexecution.
How long they are kept (retention days) stays OQ-016 residual. RPO/RTO
and offsite copy are recorded. ASM-012 (historical snapshots
are kept) remains an assumption, not a day count.

## Access

`ACT-SEC` may read audit evidence. Owning `ACT-*` roles may read
evidence for commands they are allowed to present, inside their
customer scope. Temporary identities cannot read or sign audit.

## Must not decide here

- Retention day count (OQ-016 residual)
- Log shipper, SIEM, or hash-chain product
- Legal hold procedure
