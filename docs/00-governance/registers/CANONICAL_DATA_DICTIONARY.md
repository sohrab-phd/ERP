---
id: GOV-DATA-DICT-001
title: Canonical Data Dictionary
phase: 00-governance
status: approved
version: 0.1.0
owners: [data-architect, domain-leads]
depends_on: [GOV-DOMAIN-001, GOV-GLOSSARY-001]
last_reviewed: 2026-09-04
approval: APR-002
supersedes: null
---

# Canonical Data Dictionary

This initial dictionary controls conceptual identity only. It does not authorize
tables, columns, keys, or database migrations.

## ENT-CUSTOMER

- Concept: TERM-001
- Write owner: Sales
- Identity purpose: Commercial and portal party
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

## ENT-MATERIAL-LOT

- Concept: TERM-006
- Proposed write owner: Inventory
- Identity purpose: Supplier/purchase/certificate origin
- Validation status: ownership requires Phase 02 confirmation

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
- Write owner: Production
- Identity purpose: Typed material-loss/disposition fact
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

## ENT-SHIPMENT

- Concept: TERM-017
- Write owner: Shipping
- Identity purpose: Controlled stock exit and delivery grouping
- Validation status: proposed

## ENT-INVOICE

- Write owner: FinanceLite
- Identity purpose: Operational receivable document
- Validation status: proposed; legal boundary pending OQ-012
