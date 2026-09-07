---
id: INT-CAT-001
title: Integration Catalogue and Adapter Contracts
phase: 08-integration-deployment
status: approved
version: 0.3.0
owners: [integration-architect]
depends_on: [APP-CMD-001, APP-BG-001, SEC-ISO-001, DATA-TX-001, APR-009, APR-010]
last_reviewed: 2026-09-07
approval: APR-010
supersedes: null
---

# Integration Catalogue and Adapter Contracts

Named adapters and the only contract they may use: map, authorize, and
submit a core command. This does not choose a protocol, broker, or
package (OQ-011, OQ-012, OQ-018).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Standing rules

1. An adapter is a **commander**. `ACT-IPS` remains the only executor of
   Ledger, Balance, and unit quantity writes (INV-017, INV-018).
2. Retry of a failed *transport* uses the same `idempotency_key`
   (INV-016). A new key is a new command.
3. Customer isolation applies to every outbound payload (INV-015,
   SV-012).
4. A device or file drop that needs an unanswered identity or protocol
   rejects as `GUARD_OPEN_POLICY`. It does not invent the missing key.
5. An adapter must not split a DATA-TX-001 bundle. Partial posting of
   `PostGoodsReceipt`, `DispatchShipment`, `CompleteProductionOperation`,
   `ActivateReservation`, `AllocatePayment`, or `CreateResidualUnit` is
   forbidden (QA-SCN-BUNDLE).
6. The adapter-host or worker process identity is not a substitute for
   the original commander’s `actor_identity` (SEC-ID-001).

## Adapters (labels)

| ID | Direction | What it may submit | Must not | Open |
| --- | --- | --- | --- | --- |
| `ADP-WEIGHBRIDGE` | inbound weight evidence | Command a `PostGoodsReceipt` path | Write Ledger; split the GR bundle | OQ-011 |
| `ADP-PRINT` | outbound label/ticket | Request a print of an already posted identity | Invent barcode product; print an unposted identity | ASM-009 |
| `ADP-GL-EXPORT` | outbound Finance-Lite snapshot | Export Invoice/Payment facts | Become legal GL | OQ-012, ASM-010 |
| `ADP-PORTAL` | inbound customer channel | None in MVP for orders | `PortalPlaceOrder` | OQ-010, INV-020 |
| `ADP-REPORT` | outbound query/export | Isolated read models | Dump all customers | INV-015 |
| `ADP-LIVE` | outbound `EventNotice` / `LiveNotice` | Tell a screen a fact was accepted | Write stock; leak another customer (SV-012) | Transport OQ-018 |
| `ADP-CUTOVER` | inbound opening-stock loader | Command Ledger opening facts (`OpeningStockImport`) | Bypass OQ-015 RACI; post Balance-only; `AdjustBalance` | OQ-015, OQ-019 |
| `ADP-PLC` | future inbound telemetry | Not in MVP (ASM-008) | Silent stock write | later catalogue |
| `ADP-CMMS` | future maintenance | Not in MVP | Inventory tables | later catalogue |
| `ADP-APS` | future planning | Not in MVP | ConfirmSalesOrder | later catalogue |

`BC-INTEGRATION` may write adapter-run and outbox-delivery records
only. It must not write orders, inspections, shipments, invoices,
Ledger, or Balance.

Until OQ-015 and OQ-019 are answered, `ADP-CUTOVER` rejects as
`GUARD_OPEN_POLICY`.

## Background kinds (from APP-BG-001)

These are worker labels, not extra adapters. They still command; they
do not post.

| Kind | Integration meaning |
| --- | --- |
| `CommandRetry` | Same key after transport fail (`ADP-*` or UI) |
| `EventNotice` / `LiveNotice` | `ADP-LIVE` only; isolation required |
| `GenealogyRebuild` / `BalanceRebuild` | After restore or staleness; never `EditGenealogy` / `AdjustBalance` |
| `ReservationExpirySweep` / `InquiryQuotationExpirySweep` | Propose expire commands; unanswered policy → `GUARD_OPEN_POLICY` |
| `OpeningStockImport` | `ADP-CUTOVER` only |

## Failure handling (labels)

| Outcome | Meaning |
| --- | --- |
| Transport fail, same key | `CommandRetry` (APP-BG-001, SV-009) |
| Guard fail | Rejection family; no posted fact |
| Device down | Human `ACT-*` command (QA-R-DEVICE) |
| Unknown protocol | `GUARD_OPEN_POLICY` / OQ-011 or OQ-012 |
| Split bundle attempted | Reject; no posted subset (QA-SCN-BUNDLE) |

## Security intents these adapters must support later

| Intent | Adapter implication |
| --- | --- |
| SV-003 / SV-010 | Device/file does not write Ledger; unanswered protocol rejects |
| SV-004 / SV-009 | Same-key retry; worker is not a second stock writer |
| SV-005 / SV-012 | `ADP-REPORT`, `ADP-GL-EXPORT`, `ADP-LIVE` isolate customers |
| SV-006 | `ADP-PORTAL` must not place an order in MVP |
| SV-008 | No adapter exposes `EditGenealogy` or `AdjustBalance` |
| SV-013 | ReverseGoodsReceipt is a human SoD command, not a device replay |

## Must not exist as passing adapter paths in MVP

- `PortalPlaceOrder`
- `EditGenealogy`
- `AdjustBalance`
- Quality or Shipping writing Ledger
- Weighbridge posting stock without `PostGoodsReceipt`
- Opening-stock Balance-only load

## Must not decide here

- Modbus, REST, file-drop, or OPC-UA
- Kafka, RabbitMQ, or an ESB product
- A named accounting vendor
- Socket.IO or another live-notice product
