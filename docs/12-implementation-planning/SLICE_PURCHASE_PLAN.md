# SLICE-PURCHASE purchasing increment — plan and Definition of Done

Authority: [APR-027](../00-governance/approved-baselines/APR-027-purchasing-evidence-scope.md).
Starting accepted/pushed commit: 601e52a02430ee3f81b737c1b8ffdabc2123b63c.

## Goal, users and boundaries

Ms. Masoumi's confirmed workflow is registering completed purchases and sending
purchase proformas. Deliver the backend evidence part using individual current
organization-scoped ACT-PROC grants; names never confer permissions. Dependencies
are the accepted envelope, Identity, Procurement receiving and PostgreSQL18.6.
Procurement owns the new evidence; ACT-IPS remains the sole stock writer.

Record purchaseDocumentReference, supplierReference (descriptive name/reference,
not a master-data identity), purchaseDate and materialDescription. A separately
identified sent-proforma evidence record carries purchaseId, proformaReference and
sentDate. Optional proforma evidence can be added later; its absence never blocks a
completed purchase. Multiple documentary records are not inferred duplicates from
names/dates/references. Preserve UUID and command key across retry. No fabricated
unique supplier or document-number rule, date ordering, supplier confirmation,
approval, financial values, stock quantities, mandatory PO/receipt relationship,
external transmission, attachment upload, corrections or browser UI.

## Minimal design

1. Reconcile authority/gate/local unlock under existing Owner delegation.
2. Implement two immutable owner records, two v1 envelope commands and internal
   scoped reads through existing personal Bearer transport and composition.
3. Exercise validation, replay, authorization, real PostgreSQL races/rollback,
   migration/permissions and composed HTTP. Run pinned Windows checks.
4. Independent engineering/database/API/test and security review; fix required
   findings and retest. Document acceptance, final diff checks and local commit.

Commands: RecordCompletedPurchase, target purchase-record; RecordPurchaseProformaSent,
target purchase-proforma. Empty preconditions; closed payloads above. UUID target is
the stable evidence identity. Dates are real YYYY-MM-DD calendar dates with no
unconfirmed business timing rule; references <=128 UTF-8 bytes and description
<=512 bytes, nonempty valid Unicode without controls. Sent evidence references a
purchase in the same installation/authority through a scoped FK and owner check.
There is no mutable PO state machine. Each insertion, durable result and audit
commits on one envelope transaction. No existing owner table is updated.

Runtime SELECT/INSERT only on procurement.completed_purchase and
procurement.purchase_proforma_sent. Advisory locks serialize absent document IDs;
fresh lookups after waits distinguish equal duplicate vs changed binding. Current
ACT-PROC permission is checked before and after waits; org scope required for
commands and queries. New keys on an existing ID reject DUP/CONFLICT; same bound
key replays accepted/rejected outcomes. Technical abort/uncertain COMMIT requires
same-key retry. Purchase and proforma commands never call receiving or Inventory.

POST /purchasing/purchases and POST /purchasing/proformas accept only their matching
command. GET /purchasing/purchases/{uuid} and GET /purchasing/proformas/{uuid} return
scoped facts, never internal binding or session data. No role-selector authority
override, customer reads or all-customer projection. Existing4096-byte JSON/body,
16 active operation cap, safe errors and transaction/HTTP deadlines apply.

## Definition of Done

- Approved minimum facts and later sent-proforma evidence are recorded/retrieved
  with actual principal/time/request attribution; no foreign writes or stock post.
- Strict fields/text/calendar validation, absent-purchase and cross-scope denial;
  ordinary unknown references remain descriptive evidence.
- Accepted AND rejected durable replay, occupied-key binding/principal conflicts,
  new-key same-ID duplicate/conflict; same-key uncertainty resolves one fact/audit.
- Distinct authenticated people race at the actual document lock (not account
  serialization); exactly one record wins. Audit/handler failures roll back facts
  and outcomes; permission revoked while waiting denies subsequent work/replay.
- Real Windows PostgreSQL18.6/UTF8 with restricted distinct roles, safe fixture,
  migration restart/checksum and source UPDATE/DELETE privilege denial.
- Composed HTTP proves current personal auth/org access, expected responses,
  route/command binding, malformed/unknown input, Origin and safe output behavior.
- Relevant pinned checks pass; independent/security required findings close;
  actual behavior/limits/evidence documented and final diff reviewed before commit.

Engineering acceptance is separate from Owner UAT/release acceptance. Next
Finance-Lite remains policy-gated; no unresolved commercial policy is guessed.
