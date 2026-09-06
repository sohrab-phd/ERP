---
id: INT-CAT-001
title: Integration Catalogue and Adapter Contracts
phase: 08-integration-deployment
status: in_review
version: 0.1.0
owners: [integration-architect]
depends_on: [APP-CMD-001, APP-BG-001, SEC-ISO-001, APR-009]
last_reviewed: 2026-09-06
approval: null
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

## Adapters (labels)

| ID | Direction | What it may submit | Must not | Open |
| --- | --- | --- | --- | --- |
| `ADP-WEIGHBRIDGE` | inbound weight evidence | Command a `PostGoodsReceipt` / receive path | Write Ledger | OQ-011 |
| `ADP-PRINT` | outbound label/ticket | Request a print of an already posted identity | Invent barcode product | ASM-009 |
| `ADP-GL-EXPORT` | outbound Finance-Lite snapshot | Export Invoice/Payment facts | Become legal GL | OQ-012, ASM-010 |
| `ADP-PORTAL` | inbound customer channel | None in MVP for orders | `PortalPlaceOrder` | OQ-010, INV-020 |
| `ADP-REPORT` | outbound query/export | Isolated read models | Dump all customers | INV-015 |
| `ADP-PLC` | future inbound telemetry | Not in MVP (ASM-008) | Silent stock write | later catalogue |
| `ADP-CMMS` | future maintenance | Not in MVP | Inventory tables | later catalogue |
| `ADP-APS` | future planning | Not in MVP | ConfirmSalesOrder | later catalogue |

`BC-INTEGRATION` may write adapter-run and outbox-delivery records
only. It must not write orders, inspections, shipments, invoices,
Ledger, or Balance.

## Failure handling (labels)

| Outcome | Meaning |
| --- | --- |
| Transport fail, same key | `CommandRetry` (APP-BG-001) |
| Guard fail | Rejection family; no posted fact |
| Device down | Human `ACT-*` command (QA-R-DEVICE) |
| Unknown protocol | `GUARD_OPEN_POLICY` / OQ-011 or OQ-012 |

## Must not decide here

- Modbus, REST, file-drop, or OPC-UA
- Kafka, RabbitMQ, or an ESB product
- A named accounting vendor
