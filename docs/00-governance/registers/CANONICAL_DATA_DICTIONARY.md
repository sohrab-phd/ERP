---
id: GOV-DATA-DICT-001
title: Canonical Data Dictionary
phase: 00-governance
status: approved
version: 0.3.1
owners: [data-architect, domain-leads]
depends_on: [GOV-DOMAIN-001, GOV-GLOSSARY-001, DOM-OWN-001]
last_reviewed: 2026-09-06
approval: APR-004
supersedes: null
---

# Canonical Data Dictionary

This dictionary controls conceptual identity only. It does not authorize tables,
columns, keys, or database migrations.

APR-002 approved this register's Phase 00 seed version. APR-003 approved the
Phase 01 assimilation version. The current version is `in_review` because Phase
02 added missing conceptual entities used by the ownership matrix. Validation
statuses remain proposed or workshop-pending. This update does not authorize
detailed data design, tables, columns, keys, schemas, or migrations.

## ENT-CUSTOMER

- Concept: TERM-001
- Write owner: Sales
- Identity purpose: Commercial party; any future portal channel remains pending
  OQ-010
- Validation status: proposed

## ENT-INQUIRY

- Concept: TERM-002
- Write owner: Sales
- Identity purpose: Demand signal that may never become a Sales Order
- Validation status: proposed

## ENT-QUOTATION

- Concept: TERM-020
- Write owner: Sales
- Identity purpose: Snapshotted commercial offer
- Validation status: proposed

## ENT-SALES-ORDER

- Concept: TERM-003
- Write owner: Sales
- Identity purpose: Approved customer demand and commercial snapshot
- Validation status: proposed

## ENT-SALES-ORDER-ITEM

- Write owner: Sales
- Identity purpose: Individually fulfillable order demand
- Validation status: proposed

## ENT-FULFILLMENT-ASSESSMENT

- Concept: TERM-004
- Write owner: Sales
- Identity purpose: Feasibility result and supply path
- Validation status: proposed

## ENT-UNFULFILLED-DEMAND

- Concept: TERM-005
- Write owner: Sales
- Identity purpose: Lost/unserved demand independent of order delay
- Validation status: proposed

## ENT-SUPPLIER

- Concept: TERM-021
- Write owner: Procurement
- Identity purpose: Purchasing party and certificate/lot source reference
- Validation status: proposed

## ENT-PURCHASE-ORDER

- Concept: TERM-022
- Write owner: Procurement
- Identity purpose: Purchasing commitment
- Validation status: proposed

## ENT-GOODS-RECEIPT

- Concept: TERM-019
- Write owner: Procurement for commercial/receiving orchestration; Inventory
  Posting Service for resulting lot/unit stock
- Identity purpose: Inbound receiving document split from stock posting
- Validation status: Phase 02 design proposes the split; workshop confirmation
  still required

## ENT-MATERIAL-LOT

- Concept: TERM-006
- Proposed write owner: Inventory
- Identity purpose: Supplier/purchase/certificate origin
- Validation status: Phase 02 design proposes Inventory write ownership;
  workshop confirmation still required

## ENT-INVENTORY-UNIT

- Concept: TERM-007
- Write owner: Inventory
- Identity purpose: Physical stock identity and lifecycle
- Validation status: proposed

## ENT-INVENTORY-LEDGER

- Write owner: Inventory Posting Service
- Identity purpose: Immutable stock movement evidence
- Validation status: proposed

## ENT-INVENTORY-BALANCE

- Write owner: Inventory Posting Service
- Identity purpose: Current quantity projection reconciled to Ledger
- Validation status: proposed

## ENT-RESERVATION

- Concept: TERM-009
- Write owner: Inventory
- Identity purpose: Demand claim against available stock
- Validation status: proposed

## ENT-PRODUCTION-ORDER

- Concept: TERM-011
- Write owner: Production
- Identity purpose: Authorized production plan
- Validation status: proposed

## ENT-MATERIAL-ALLOCATION

- Concept: TERM-010
- Write owner: Production
- Identity purpose: Production-side assignment of an Inventory Unit to a
  Production Order or operation; distinct from Reservation
- Validation status: proposed

## ENT-PRODUCTION-OPERATION

- Write owner: Production
- Identity purpose: Executable/recordable routing step
- Validation status: open pending OQ-003

## ENT-MATERIAL-CONSUMPTION

- Write owner: Production
- Identity purpose: Authoritative input transformation fact
- Validation status: proposed

## ENT-PRODUCTION-OUTPUT

- Write owner: Production
- Identity purpose: Authoritative output transformation fact
- Validation status: proposed

## ENT-RESIDUAL

- Concept: TERM-012
- Write owners: Production fact; Inventory resulting unit
- Identity purpose: Parent-child usable remainder relationship
- Validation status: open pending OQ-009

## ENT-SCRAP

- Concept: TERM-013
- Write owners: Production owns the scrap creation/disposition fact; Inventory
  Posting Service owns the associated stock movement and balance effect where
  scrap changes inventory
- Identity purpose: Typed material-loss/disposition fact linked to any required
  Inventory posting evidence
- Validation status: proposed

## ENT-PRODUCT-BATCH

- Concept: TERM-014
- Write owner: Production
- Identity purpose: Batch-level output and quality/shipment subject
- Validation status: open pending OQ-004

## ENT-QUALITY-INSPECTION

- Write owner: Quality
- Identity purpose: Inspection evidence and disposition
- Validation status: open pending OQ-005

## ENT-PACKAGE

- Concept: TERM-023
- Write owner: Shipping
- Identity purpose: Packing grouping before Shipment dispatch
- Validation status: proposed

## ENT-SHIPMENT

- Concept: TERM-017
- Write owner: Shipping
- Identity purpose: Controlled stock exit and delivery grouping
- Validation status: proposed

## ENT-INVOICE

- Write owner: FinanceLite
- Identity purpose: Operational receivable document
- Validation status: proposed; legal boundary pending OQ-012

## ENT-PAYMENT

- Concept: TERM-024
- Write owner: FinanceLite
- Identity purpose: Operational receipt and allocation against Invoice
- Validation status: proposed; legal boundary pending OQ-012

## ENT-GENEALOGY-LINK

- Concept: TERM-025
- Write owner: none as independent truth; Reporting may materialize a
  rebuildable projection
- Identity purpose: Query projection of Genealogy source facts
- Validation status: proposed; must remain rebuildable (RISK-005)
