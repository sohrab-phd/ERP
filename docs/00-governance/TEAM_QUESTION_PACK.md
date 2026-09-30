---
id: GOV-QPACK-001
title: Team Question Pack
phase: 00-governance
status: approved
version: 0.6.0
owners: [chief-solution-architect, project-sponsor]
depends_on: [GOV-QUESTIONS-001, ASM-015]
last_reviewed: 2026-10-01
approval: APR-014
supersedes: null
---

# Team Question Pack

This is the standing handoff the Project Owner takes to the team. Canonical
status stays in [OPEN_QUESTIONS.md](registers/OPEN_QUESTIONS.md). This pack
does not approve a phase or authorize implementation.

As of: `2026-10-01` after opening-stock evidence review.
Gates 1–6 remain valid. Gate 6 remains ready for a
**separate human** implementation authorization decision. CHK-0013 remains
`a6b893095af7c9d14f342371fb6e4ef9c6d833df`. There is no Phase 13. Factory
findings do **not** authorize implementation and do not create an unlock
file.

**Answered:** OQ-002, OQ-004, OQ-006, OQ-007, OQ-008, OQ-010, OQ-012,
OQ-013, OQ-016, OQ-017, OQ-018.

**Still treating (residuals only):** OQ-019, OQ-001, OQ-003, OQ-005,
OQ-009, OQ-011, OQ-014, OQ-015.

**Factory evidence recorded, not closed:** FACT-01 confirms kg-first
(OQ-001 still treating: kg measurement precision for Coil→Sheet is
recorded; kg↔length formula is not). FACT-02 confirms hybrid grain and
order-code traceability (order-code identity still unclassified). FACT-04
is an eleven-person personnel roster only (OQ-019 still treating).
FACT-03 warehouse Coil→Sheet is recorded as an inventory transformation
without a customer order or Production Order; the posting-boundary
conflict with `CompleteProductionOperation` is open. A future dedicated
OQ may be required. FACT-05 shared station accounts are superseded:
personal operator accounts only. FACT-06 Entry and Referral are defined
and are not Start or `CompleteProductionOperation`. Residual/Scrap:
reusable waste = Residual and returns to the warehouse; non-reusable =
Scrap; no universal cutoff; a person decides. Current factory QC: no
department, no Quality role, outside the current MVP. Future Quality
architecture is retained. OQ-005 and OQ-009 stay treating. No named
delegate.

ADR-0006 and ADR-0007 are accepted. ADR-0008, NestJS, Prisma, Docker, and
extra MCP are not. `IMPLEMENTATION_AUTHORIZED` remains `false`.

## Standing process

1. When a residual arrives, record it on the matching `OQ-*` row. Do not
   invent the rest.
2. Continue only the work authorized by
   [CURRENT_PHASE.md](CURRENT_PHASE.md).
3. A question pack is not an unlock.

## Still needed

### OQ-019 — Role mapping, operators, sign-off

- Ask: Map each of the 11 factory-listed people (or state that a workshop
  role has no factory person) onto the workshop/sign-off roles. Attendance
  and approval scope are still missing. Supply the approximately 10
  operator names when ready. Confirm the Accounting Manager spelling
  (Goodarzi / Goudarzi) as one person.
- Why: The 11-person roster, title variations, and "no named delegate"
  are recorded. Do not invent a delegate. Do not map anyone to Quality.
  The current MVP has no Quality person. Operator names are still missing.
  This is not an `ACT-*` or SoD matrix.

### OQ-001 — kg↔length formula; arithmetic beyond the measurement statement

- Ask: The material-specific kg↔length formula and factors, with one
  example, if conversion is actually used. Confirm whether zero decimal
  places / 1 kg / "rounding not needed" applies only to scale measurement
  or also to every stored kg value. If a measured-vs-expected weight
  difference needs an automatic accept/reject threshold, supply that
  threshold. If it should only be displayed, say so.
- Why: kg-only stock quantity, 0 decimals / 1 kg / no measurement
  rounding, no weight↔count conversion, and "show the weight difference"
  are already recorded. The formula and any automatic measurement
  threshold are not. Do not treat that threshold as OQ-006 fulfillment
  tolerance or as Residual/Scrap. OQ-001 stays treating.

### OQ-003 — Current stations are recorded; route mechanism and Entry/Referral model are not

- Ask: How a per-order route is stored, including which of the ten current
  stations are used or skipped. How Entry and Referral are kept beside
  Production Operation start/complete without merging them. How recorded
  login and logout are stored. Whether the architecture phrase "work
  center" should be dropped or treated as the same thing as Station. The
  exact stop/cancel command, including the existing pre-post versus
  post-post split.
- Why: The ten station names, per-order routing, skip, personal accounts,
  recorded login/logout, and Entry/Referral definitions are recorded.
  Login is not Entry. A Station completion does not post. OQ-003 stays
  treating. Do not assume a fixed sequence of all ten stations. Do not
  invent a Production Planner.

### FACT-05 — shared station accounts are superseded

- Do not ask for a shared Station account. The clarification says there is
  none. Personal operator accounts are required. About 10 operator names
  are still missing (OQ-019).
- Still open only as identity design: which commands must carry personal
  attribution, and how a shared terminal presents a personal login. That
  is not permission to invent RBAC.

### OQ-005 — Quality is outside the current MVP

- Do not ask for current Quality personnel, a QC department, or a Quality
  approval actor. The factory has none. Do not assign another employee to
  Quality.
- If Quality is later brought into scope, plans, limits, samples, and
  named people would still be required. Those are not current-MVP inputs.
- Why: Hold/release architecture is retained as future capability. OQ-005
  stays treating. It is not current factory execution.

### OQ-009 — How the human Residual/Scrap decision is recorded

- Ask: For any family outside this statement, is there a numeric
  keep/scrap rule? How is Mr. Dinavand's reusability decision recorded
  without a new command?
- Why: Reusable = Residual and returns to the warehouse. Non-reusable =
  Scrap. No universal cutoff. Do not classify from weight or dimensions.
  Order scrap uses Order Code. The factory has not defined process loss,
  consumption timing, or partial versus complete consumption. Good output
  versus WIP is architecture, not a factory workflow. OQ-009 stays
  treating. The missing-threshold guard is not rewritten.

### FACT-03 — Coil → Sheet posting boundary (no dedicated OQ yet)

- Already recorded. Do not re-ask as blank: workshop conversion of an
  opened Coil to Sheets; no customer order and no Production Order
  required for warehouse conversion; separate from customer-order
  production; one Coil leaves and many Sheets enter; Coil Code kept;
  Sheet Code = Coil Code + Sheet number; Order Code only when applicable;
  measured kg is the stock quantity; 6 m and 12 m are examples; cutting
  loss is Residual or Scrap by human decision; a standalone incoming
  Sheet gets its own product code and no invented Coil Code; Mr. Dinavand
  decides in the organizational sense only.
- Still ask: which posting boundary records "one Coil leaves, many Sheets
  enter" without silently using `CompleteProductionOperation`? Is the
  factory Sheet Code globally unique, and is it the Inventory Unit
  business identity?
- Why: factory classification and the live production-posting architecture
  conflict. A future dedicated OQ may be required. Do not add this to
  DATA-TX-001 until that reconciliation exists.

### Commercial amount, invoice handoff, and payment methods

- Already recorded: estimated amount = required weight × price per kg;
  final amount = actual/final weighbridge weight × applicable price per kg
  + cutting service fee; Mr. Pour-Ebrahim issues the customer invoice and
  gives it to Mr. Ghaffari; Mr. Ghaffari records it and uploads the record
  to an unrelated external system; payment methods are deposit with
  remainder after delivery, cheque or promissory note, and known-customer
  credit. Payment does not close the Sales Order. Finance-Lite is not
  legal GL. The weighbridge does not write the Ledger.
- Still ask: who owns price per kg and whether prices are versioned; the
  cutting-service fee formula and who sets it; the external system's
  identity and whether upload is manual; deposit percentage and settlement
  deadline; who records a customer payment; whether a payment must link
  to an invoice; partial payment; how a cheque or promissory note is
  recorded or settled; credit approval or a credit limit; whether payment
  timing affects shipment; what a customer balance means; payment
  correction or reversal. Do not invent tax, discount, currency, or a
  legal ledger. Do not treat Finance-Lite allocation commands as the
  factory procedure.
- Why: the factory stated the two amount formulas and the handoff. It did
  not state the items above. No new `OQ-*` is opened here.

### Incoming material and the receiving boundary

- Already recorded: one intake station with Mr. Karimi; Internal Code,
  Count, Weight, Type; Coil, Sheet, angle, beam, and similar types;
  kg is the stock quantity; Count is descriptive; no weight↔count
  conversion; standalone incoming Sheets have no fabricated Coil parent;
  quantity posting remains `PostGoodsReceipt` through the Inventory
  Posting Service; current intake does not require Quality approval;
  normal receiving is not opening-stock cutover.
- Still ask: purchase-approval person if any; supplier-selection rules;
  receiving discrepancy or tolerance; supplier document set beyond the
  purchase proforma; whether intake weight uses a device (OQ-011).
  Do not ask for a current Quality approver. Do not treat Ms. Masoumi's
  proforma as a customer invoice.
- Why: the factory named the intake facts and the person. It did not
  name an approval chain or a second stock writer. OQ-015 and OQ-019
  stay treating.

### Procurement — factory facts are narrower than the Purchase Order machine

- Already recorded: Ms. Masoumi registers purchases and sends proformas.
  That is not a customer invoice, not purchase approval, not receiving,
  and not an inventory post. Mr. Karimi records intake: Internal Code,
  Count, Weight, Type. kg is the stock quantity. No current QC on intake.
  Quantity posting stays `PostGoodsReceipt` through the Inventory Posting
  Service.
- Still ask: supplier identity and approval; whether the factory uses a
  Purchase Order; who may create or approve one; what a proforma means
  beyond sending; supplier confirmation; purchase changes, cancellation,
  and returns; price, currency, tax, and payment; what happens when
  received weight differs from a purchase quantity; partial, over, and
  under receipt. Do not treat the Purchase Order state machine as a
  factory procedure.
- Why: those items are not in the factory evidence. No new `OQ-*` is
  opened. OQ-019 stays treating for the unnamed approver.

### Customer-order change and cancellation — procedure not defined

- The OQ-007 close rule stays answered. Do not reopen it. Payment,
  invoice, and `DELIVERED` are still not close guards. Valid remaining
  demand is still not discarded.
- Ask, if the factory can say: who may request, approve, record, or
  execute a change or cancellation; whether a confirmed order may be
  edited; what a quantity or material change does to demand; what happens
  to an active reservation, to production already started, and to material
  already produced; whether customer confirmation or a reason code is
  required; whether cancellation can follow a shipment; whether a
  cancelled order can be reopened.
- Do not treat Mr. Dinavand's production stop/cancel decision as Sales
  Order cancellation authority. Do not infer authority from Sales Manager,
  Warehousekeeper, or CEO. Do not invent a delegate.
- Why: the factory has not specified this procedure. Architecture cancel
  and change commands stay candidates. No new `OQ-*` is opened.

### Shipment and delivery — factory process is not defined

- Already recorded, and not reopened: Sales Order closure does not depend
  on `DELIVERED`, invoice status, or payment (OQ-007). Partial shipment
  is allowed only when the line allows it (OQ-006, default tolerance 0).
  One active reservation per Inventory Unit (OQ-008). Stock exit, if
  posted, is through the Inventory Posting Service.
- Do not ask anyone on the 11-person roster to be the shipper. The factory
  has not named who prepares, authorizes, loads, records, or confirms
  delivery, and has not named a carrier, a shipment document, or delivery
  evidence.
- Why: "settlement after delivery" is a payment method only. It is not a
  logistics workflow and not a close guard. No shipping role is invented.

### OQ-011 — Weighbridge device

- Ask: Make/model/location, protocol or “ticket only”, duplicate id,
  named Goods Receipt operator.
- Why: Trust rule and human fallback are recorded; auto-path stays
  `SPIKE-DEVICE` until the device exists. Final invoice weight is not a
  second Ledger writer. Incoming intake weight is not assumed to be that
  device.

### OQ-014 — Monthly volumes

- Ask: Typical and peak monthly GR, Coils, order lines, operations,
  ledger rows, shipments, with source (system / Excel / signed guess).
- Why: Modest-scale user counts are recorded; transaction counts are not.

### OQ-015 — Cutover files and signers

- Ask: Whether an opening-stock file exists; which materials it includes;
  who counts, prepares, and signs it; freeze date/time; source document;
  whether Coil Code, Sheet Code, or Internal Code is required; how
  existing Residual and Scrap are represented; whether opening stock is
  a Goods Receipt.
- Why: `OpeningStockImport` is an architecture candidate only. The factory
  has not confirmed that procedure. `ADP-CUTOVER` stays
  `GUARD_OPEN_POLICY`. Normal incoming receiving does not answer this.
  Do not invent a signer, a valuation, or an import tool.

## Already recorded (do not re-ask as if blank)

OQ-002 weight-authoritative Coil (FACT-01 reinforces); OQ-004 hybrid
tracking and no unique ID per tiny cut piece (FACT-02 confirms); order
code as practical trace key for cut pieces and order scrap (FACT-02;
exact order-code identity still open); OQ-006 default tolerance 0;
OQ-007 close SO on fulfillment not payment; OQ-008 one Coil one
reservation and no timer on confirmed SO; OQ-010 visibility-only portal;
OQ-012 Finance-Lite not legal GL; OQ-013 one entity one site; OQ-016
RPO 60 / RTO 8; OQ-017 app-owned PostgreSQL transaction posting; OQ-018
Modular Monolith + PostgreSQL, packages not frozen; FACT-04 eleven-person
organizational roster (not a role mapping). Coil→Sheet warehouse
conversion facts listed under FACT-03 in the question pack are recorded;
do not re-ask them as if blank. The posting-boundary conflict is still
open.

## Work that continues

- Apply residuals onto the matching `OQ-*` row.
- Do **not** map FACT-04 people onto workshop/`ACT-*` rows until the
  sponsor supplies that mapping.
- Maintain registers. Do not write application source. Do not create an
  unlock file. Do not start Phase 13.
- `IMPLEMENTATION_AUTHORIZED` remains `false`.
