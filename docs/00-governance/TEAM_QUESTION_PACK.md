---
id: GOV-QPACK-001
title: Team Question Pack
phase: 00-governance
status: approved
version: 0.3.0
owners: [chief-solution-architect, project-sponsor]
depends_on: [GOV-QUESTIONS-001, ASM-015]
last_reviewed: 2026-09-07
approval: APR-013
supersedes: null
---

# Team Question Pack

This is the standing handoff the Project Owner takes to the team. It is
refreshed after every phase gate package. Canonical status stays in
[OPEN_QUESTIONS.md](registers/OPEN_QUESTIONS.md). This pack does not close
questions, approve a phase, or authorize implementation.

As of: `2026-09-07` after Phase 11 approval (APR-013), including ASM-024.
CHK-0011 remains `1d581c4357a784f3170bd42349a47c1b38bde1e6`. The APR-013
Git checkpoint is pending. Phase 12 structure drafting is authorized
(proposed ASM-025); Phase 12 is not approved. The Project Owner will
return answers in a few days. Architecture work continues only as
authorized; answers are not an immediate stop. A question pack is not
approval.
Unanswered: `OQ-001` through `OQ-019`.
Phase 00 and Phase 01 left **no remaining phase-owned unanswered questions**.
Every item below was raised in Phase 01 assimilation and is still open.
Phase 03 cites them as open guards. None are answered.

## Standing process

1. Finish the phase gate package.
2. Group every unanswered `OQ-*` by related/owning phase.
3. Ask the Project Owner in the conversation and refresh this pack.
4. Continue only the work authorized by
   [CURRENT_PHASE.md](CURRENT_PHASE.md) while answers are pending.
5. When an answer arrives, record it on the `OQ-*` row. Do not invent the rest.

Fill blanks in [TEAM_ANSWER_SHEET.md](TEAM_ANSWER_SHEET.md). Who to ask and
which workshop block to use are in
[WORKSHOP_COLLECTION_MAP.md](../02-domain-business-architecture/WORKSHOP_COLLECTION_MAP.md).

## How to return answers

Use this shape, or fill the answer sheet. Partial answers are fine.

```
OQ-NNN:
- Answer:
- Evidence (who / document / example):
- Still unknown:
```

For OQ-019, a table row is better:

```
Role | Full name | Delegate or none | Attendance | Approval scope
```

---

## Phase 02 — workshop and owner-signed business answers

These are the items to take to the team first. Architecture design may
continue without them. Workshop execution and owner-signed policy may not.

### OQ-019 — Named workshop participants

- Ask: Who is the real person for each workshop role?
- Why: Temporary names cannot attend, sign, or approve.
- Useful answer: one row per role: full name, delegate or `none`, attendance
  date or `yes`/`no`, approval scope. Roles are listed in
  [WORKSHOP_ROSTER.md](../02-domain-business-architecture/WORKSHOP_ROSTER.md).

### OQ-010 — Customer Portal

- Ask: In the first live system, may customers order on a portal, only see
  status/documents, only send a request, or have no portal at all?
- Why: Sources conflict. Ordering is currently deferred from MVP so design
  can continue. This does not decide the later roadmap.
- Useful answer: MVP portal actions (none / visibility / request / order),
  later-phase intent, and who may see prices or documents.

### OQ-013 — Organization and site

- Ask: For the planning horizon, is there one legal company and one main
  factory site, or more?
- Why: Numbering, warehouses, reporting, and tenancy change if there are
  several companies or sites.
- Useful answer: legal entities, sites, and whether a second site is in
  scope for the first go-live.

### OQ-001 — Units of measure

- Ask: For each material and product family, which unit is official, how do
  units convert, and how do you round?
- Why: Stock, price, and mass balance will be wrong if this is guessed.
- Useful answer: a table of family, official unit, allowed conversions,
  decimal places, rounding rule, and one numeric example.

### OQ-002 — Coil quantity

- Ask: Is a Coil’s official stock quantity weight only, or weight plus
  length?
- Why: Availability, consumption, and tolerance change.
- Useful answer: current scale/practice, whether length is measured or
  calculated, and one sample ticket.

### OQ-003 — Production routing and posting points

- Ask: What are the real production steps, and at which step is material
  officially consumed or produced?
- Why: Operations, WIP, and genealogy depend on the official posting point.
- Useful answer: step list by product line, measurement point, and the
  official consume/output moment.

### OQ-004 — Tracking granularity

- Ask: Which products must be tracked as a batch, a bundle, or each piece?
- Why: Labels, genealogy, and data volume change.
- Useful answer: product or customer rule, and any regulatory requirement.

### OQ-005 — Quality plans and release authority

- Ask: Which incoming, in-process, and final checks are mandatory, and who
  may hold, release, or make an exception?
- Why: Stock must not become available or shippable while required QC is
  open.
- Useful answer: check list, sample/limit if known, named roles, and
  exception rule. If numbers are unknown, name the roles first.

### OQ-006 — Fulfillment tolerances

- Ask: How much partial shipment, over-production, or over-delivery is
  allowed?
- Why: Orders, reservations, and shipments need a numeric limit.
- Useful answer: percent or weight by product family, and who may exceed it.

### OQ-008 — Reservation policy

- Ask: When does a reservation expire, who wins if two orders want the same
  Coil, and may one Coil serve several orders?
- Why: Fairness, leftover stock, and concurrency.
- Useful answer: expiry, priority rule, under-consumption release, and
  one-Coil-to-many-orders yes/no.

---

## Phase 03 — state machines and invariants

Ask these in the same team conversations. They are needed before any
Phase 03 numeric or named guard can close. The Phase 03 *design-gate* may
complete with them still open if you accept ASM-016. They do not have to
block that approval.

### OQ-007 — Sales Order closure

- Ask: Is a Sales Order closed when goods are delivered, when it is paid, or
  only when both are done?
- Why: Sales and finance statuses will fight each other.
- Useful answer: one rule, plus what happens if delivery is complete and
  payment is late.

### OQ-009 — Residual versus scrap

- Ask: What minimum size or weight makes leftover material a reusable
  residual instead of scrap?
- Why: Identity, mass balance, and disposition need a cutoff.
- Useful answer: threshold by material family, with one shop-floor example.

The Phase 02 items above (OQ-001 through OQ-006, OQ-008) also feed Phase 03
numeric guards. If the team answers them now, those transition guards can
be closed without waiting for another meeting.

---

## Phase 04 — database and physical design

### OQ-014 — Volumes

- Ask: What are typical and peak monthly receipts, coils/units, order lines,
  operations, stock movements, and shipments?
- Why: Capacity, indexes, and retention.
- Useful answer: at least 12 months of counts, or a defensible estimate
  signed by operations.

### OQ-017 — Inventory posting mechanism

- Ask: This is an architecture/evidence question, not a shop-floor vote.
  Which posting style should be proven later: application transaction,
  restricted database functions, or a hybrid?
- Why: This is the stock-integrity kernel.
- Useful answer: not required from the factory team now. Sponsor should know
  it remains open until a later authorized evidence spike.

---

## Phase 05 — application and platform

### OQ-018 — Platform choices beyond Node.js

- Ask: This is not a factory-floor question. Only Node.js + TypeScript is
  already decided. Frameworks, database product, frontend, and deployment
  remain open.
- Why: Those choices must not become defaults by repetition.
- Useful answer: from the team now, only constraints (what you refuse, what
  you already operate, who must maintain it). Detailed ADRs come later.
  Extra MCP/tool products (`MCP-EXTRA` in Phase 10) belong here too.

---

## Phase 08, integration, deployment, and go-live

### OQ-011 — Weighbridge

- Ask: Which scale/device exists, how does it send a weight, what is the
  transaction id, and what is the manual fallback when the device is down?
- Why: Trusted weight and duplicate protection.
- Useful answer: make/model, protocol or file, sample ticket, fallback
  procedure.

### OQ-012 — Legal accounting

- Ask: Which accounting system is legally authoritative, and what
  API/file/export exists?
- Why: This system’s Finance-Lite must not pretend to be the legal books.
- Useful answer: product and version, owner, and a sample export or
  interface note.

### OQ-015 — Opening-stock cutover

- Ask: Where does opening stock come from, how is the count frozen, who
  signs, and how are discrepancies handled?
- Why: The system cannot become stock truth without a controlled opening
  balance.
- Useful answer: source list, freeze procedure, discrepancy workflow, and
  named sign-off roles. Real names can wait if roles are clear.

### OQ-016 — Recovery and retention

- Ask: How much data loss is acceptable (RPO), how fast must the system
  return (RTO), how long are backups kept, and is an off-site copy required?
- Why: Current numbers are proposals, not management commitments.
- Useful answer: RPO, RTO, retention days, off-site yes/no, and who approved.

---

## Assumptions the team should confirm or replace

These are not extra questions. They ride with the OQs above. Say `keep`,
`replace`, or `unknown`.

| ID | Claim | Confirm with |
| --- | --- | --- |
| ASM-001 | One legal entity and one principal site | OQ-013 |
| ASM-002 | About 15–25 concurrent users, under 100 total | sponsor |
| ASM-003 | Weight is the primary inventory measure | OQ-001, OQ-002 |
| ASM-004 | Finished product is normally tracked at batch level | OQ-004 |
| ASM-005 | A Coil has one active physical location | warehouse |
| ASM-006 | Posted records are reversed, not deleted | controls |
| ASM-007 | Factory LAN is generally available | OQ-011 / infrastructure |
| ASM-008 | Production events are human-frequency, not PLC telemetry | production |
| ASM-009 | Standard/manual barcode printing is acceptable at first | warehouse |
| ASM-010 | External accounting remains legal authority | OQ-012 |
| ASM-011 | A small team must be able to maintain the system | sponsor |
| ASM-012 | Historical snapshots and correction evidence are kept | controls |

ASM-013, ASM-014, ASM-016, ASM-017, ASM-018, ASM-019, and ASM-020 are
process assumptions already used so design can continue. They are not
shop-floor facts. ASM-021 is accepted by APR-010. ASM-022 is accepted
by APR-011. ASM-023 is accepted by APR-012. ASM-024 is accepted by
APR-013. ASM-025 is proposed for the Phase 12 structure gate and is
not accepted until the Project Owner says so.

## Work that continues while answers are pending

- Phase 02 remains approved as APR-004 / CHK-0003.
- Phase 03 is approved as APR-005, including ASM-016. CHK-0006 records
  the freeze at `bef6b6464baaf62ac8d3db9f9b7fa835ad04ec6c`. These
  questions stay open.
- Temporary roster identities still have no approval authority.
- Phase 04 is approved as APR-006, including ASM-017. CHK-0004 records
  the checkpoint at `87f9f10442d58fbd224dce09f46c862eb8707e8f`. Physical
  types, executable schemas, and posting-mechanism ADRs are still not
  approved.
- Phase 05 is approved as APR-007, including ASM-018. CHK-0005 records
  the checkpoint at `00b30a3064027fd0584c35c5f479b04d087614a6`.
  Frameworks and packages stay OQ-018.
- Phase 06 is approved as APR-008, including ASM-019. CHK-0007 records
  the checkpoint at `167353573840ef22d23049b864636d7383c61911`. Named
  people, auth packages, and retention days stay open.
- Phase 07 is approved as APR-009, including ASM-020. CHK-0008 records
  the checkpoint at `29921d69e10bf6704966a08ff927d9e6ae9c0bd3`. Test
  runners and quantity oracles stay open.
- Phase 08 is approved as APR-010, including ASM-021. CHK-0009 records
  the checkpoint at `751035d2359abb5bd99a1b8a254715b2a5c937ae`.
  Weighbridge protocol, legal accounting product, hosting, and RPO/RTO
  minutes stay open.
- Phase 09 is approved as APR-011, including ASM-022. CHK-0010 records
  the checkpoint at `81aef0e7bc217cf5172b1f64edf13848b6242bb2`.
  Package manager, Git hosting, CI product, and named maintainers stay
  open.
- Phase 10 is approved as APR-012, including ASM-023. CHK-0011 records
  the checkpoint at `1d581c4357a784f3170bd42349a47c1b38bde1e6`.
  Extra MCP/tool products and named agent approvers stay open.
- Phase 11 is approved as APR-013, including ASM-024. Git checkpoint
  pending. `TEST-*` catalogue and named UAT people stay open.
- Phase 12 structure drafting is authorized. Unanswered OQs, a
  `TEST-*` catalogue, named people, and the unlock file stay open
  (proposed ASM-025). Phase 12 approval would not be an implementation
  unlock.
- `IMPLEMENTATION_AUTHORIZED` remains `false`.
- Returned answers will be written onto the matching `OQ-*` row and this
  pack will be refreshed.
