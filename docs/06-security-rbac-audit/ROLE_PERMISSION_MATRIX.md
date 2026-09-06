---
id: SEC-RBAC-001
title: Role Permission and Scope Matrix
phase: 06-security-rbac-audit
status: in_review
version: 0.1.0
owners: [security-architect, business-control-owner]
depends_on: [DOM-ACTORS-001, SM-SOD-001, APP-CMD-001, APR-007]
last_reviewed: 2026-09-06
approval: null
supersedes: null
---

# Role Permission and Scope Matrix

Which `ACT-*` role may present which Phase 05 command family. This is
a permission catalogue, not an RBAC library and not named people
(OQ-019). Backend evaluation is required (INV-015).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Standing rules

| ID | Rule |
| --- | --- |
| `SEC-001` | Actor must be an `ACT-*` role from DOM-ACTORS-001 |
| `SEC-002` | Temporary \* `(temporary)` identity → `GUARD_ACTOR` |
| `SEC-003` | `ACT-IPS` executes stock writes and never owns business policy |
| `SEC-004` | `ACT-QC` and `ACT-SHIP` command Inventory; they do not write stock tables |
| `SEC-005` | `ACT-CUST` is never A or R; portal order commands → `GUARD_PORTAL_MVP` |
| `SEC-006` | Sensitive pairs from SM-SOD-001 require two distinct human identities |
| `SEC-007` | Missing named second person or unanswered OQ → `GUARD_OPEN_POLICY` |

Permission here is “may present the command.” Write ownership stays
with the owning bounded context.

## Command-family permissions

| Family | May present | Executes stock if any | Second human |
| --- | --- | --- | --- |
| Sales inquiry/quotation/order (non-cancel) | ACT-SALES | no | no |
| CloseSalesOrder | ACT-SALES | no | open: OQ-007 |
| Sales cancel / hold after confirm | ACT-SALES | no | recommended; named authority OQ-019 |
| PortalRequestInquiry / any PortalPlaceOrder | none in MVP | no | n/a — `GUARD_PORTAL_MVP` |
| Purchase Order draft/submit/send | ACT-PROC | no | no |
| ApprovePurchaseOrder | ACT-PROC | no | named approver OQ-019 |
| ReceiveGoods / DraftGoodsReceipt | ACT-PROC or ACT-WH | no (orchestration) | no |
| PostGoodsReceipt / ReverseGoodsReceipt | commander ACT-PROC or ACT-WH; executor ACT-IPS | ACT-IPS | Reverse: different human (OQ-015, OQ-019) |
| Reservation activate/consume/release | commander ACT-SALES or ACT-WH; executor ACT-IPS | ACT-IPS | no |
| Unit lifecycle except return-after-ship | commander ACT-WH or ACT-OP; executor ACT-IPS | ACT-IPS | no |
| ReturnUnit after SHIPPED | commander ACT-SHIP or ACT-WH; executor ACT-IPS | ACT-IPS | different from dispatcher (OQ-019) |
| Production plan/release/pause/resume | ACT-PLAN | no | no |
| Shop-floor operation facts | ACT-OP records; ACT-IPS posts | ACT-IPS | no — operator does not sign policy |
| AbortProductionOrder / post-post cancel | ACT-PLAN | ACT-IPS for reversals | residual/scrap already recorded |
| Quality inspection and hold/release command | ACT-QC | ACT-IPS when commanded | ConditionallyRelease named person OQ-005 |
| Package / Shipment (with demand) | ACT-SHIP | ACT-IPS on dispatch | no |
| DraftShipment without customer/order | ACT-SHIP | ACT-IPS if later dispatched | exceptional authority OQ-019 |
| Invoice / Payment (non-void) | ACT-FIN | no | no |
| VoidInvoice / ReversePayment | ACT-FIN | no | different identity than issuer (OQ-019); ACT-SEC may be the recorded authority |
| Identity / audit administration | ACT-SEC | no | no stock writes |

`ACT-IPS` never appears alone as the second human.

## Query permissions

| Query family | May read | Isolation |
| --- | --- | --- |
| Own-BC documents | owning `ACT-*` | customer scope required |
| GetAvailability / GetLedger / GetBalance / GetUnit | ACT-WH, ACT-SALES (availability), ACT-PLAN (allocation context), ACT-SEC (audit) | customer and, when answered, site (OQ-013) |
| TraceForward / TraceBackward | ACT-QC, ACT-WH, ACT-SALES, ACT-SEC | rebuild-only; no write |
| GetInvoice / GetPayment | ACT-FIN; ACT-SALES may see own-order invoices | customer isolation |
| Portal customer reads | not in MVP | OQ-010 |

A role that cannot present a command also cannot obtain a query
result that would disclose another customer’s payload.

## Must not decide here

- Group, claim, or JWT shape (OQ-018)
- Real named holders of each role (OQ-019)
- Multi-site role grants (OQ-013)
