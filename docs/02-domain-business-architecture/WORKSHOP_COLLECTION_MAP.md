---
id: DOM-QMAP-001
title: Workshop Collection Map
phase: 02-domain-business-architecture
status: approved
version: 0.1.1
owners: [business-process-owner, chief-solution-architect]
depends_on: [ASM-WORKSHOP-001, GOV-QPACK-001, DOM-ROSTER-001]
last_reviewed: 2026-09-06
approval: APR-004
supersedes: null
---

# Workshop Collection Map

This map tells the Project Owner **who to ask** and **which planned workshop
block** collects each unanswered question. It does not execute the workshop,
does not replace
[WORKSHOP_AGENDA.md](../01-project-assimilation/WORKSHOP_AGENDA.md), and does
not invent answers.

Temporary roster names have **no** approval authority. Use the role, not the
`(temporary)` person, until OQ-019 is replaced with real names.

Fill answers in [TEAM_ANSWER_SHEET.md](../00-governance/TEAM_ANSWER_SHEET.md).

## Suggested meeting order

Take Phase 02 rows to the team first. Use the same meetings for Phase 03 rows
if time allows. Later-phase rows can wait for a shorter follow-up.

| Ask first | Then if time | Later follow-up |
| --- | --- | --- |
| OQ-019, OQ-010, OQ-013, OQ-001, OQ-002, OQ-003, OQ-004, OQ-005, OQ-006, OQ-008 | OQ-007, OQ-009 | OQ-011, OQ-012, OQ-014, OQ-015, OQ-016, OQ-017, OQ-018 |

## Who to ask

| ID | Suggested room owner | Also in the room | Agenda block |
| --- | --- | --- | --- |
| OQ-019 | Project Sponsor | Business Process Owner | 1. Stakeholders |
| OQ-010 | Sales/CRM and Customer Portal owner | Sponsor, Security | 2. Scope and portal |
| OQ-013 | Project Sponsor | Business Process Owner | 2. Scope; 10. NFRs |
| OQ-001 | Data Steward | Inventory, Sales, Production | 3. Units and weight |
| OQ-002 | Inventory/Warehouse owner | Production, Data Steward | 3. Units and weight |
| OQ-003 | Production/MES owner | Operator, Inventory | 4. Genealogy; 6. Posting |
| OQ-004 | Production/MES owner | Quality, Data Steward | 4. Genealogy; 7. Quality |
| OQ-005 | Quality owner | Inventory, Shipping, Security | 5. States; 7. Quality |
| OQ-006 | Sales/CRM owner | Production, Shipping | 5. States |
| OQ-008 | Inventory/Warehouse owner | Sales, Production | 5. States; 6. Posting |
| OQ-007 | Sales/CRM owner | Finance-Lite | 5. States |
| OQ-009 | Production/MES owner | Inventory, Quality, Operator | 4. Genealogy; 7. Quality |
| OQ-014 | Inventory/Warehouse owner | Production, Shipping, Sponsor | 10. NFRs |
| OQ-017 | Solution Architecture | Data Architecture, Inventory | 6. Posting; 11. Platform |
| OQ-018 | Solution Architecture | Sponsor, Infrastructure | 11. Platform |
| OQ-011 | Integration representative | Procurement, Inventory, Infrastructure | 3. Units; 9. Integrations |
| OQ-012 | External accounting-system owner | Finance-Lite | 2. Scope; 9. Integrations |
| OQ-015 | Inventory/Warehouse owner | Sponsor, Security | 1. Stakeholders; 6. Posting |
| OQ-016 | Infrastructure/Operations | Sponsor, Security | 8. Security; 10. NFRs |

## Evidence to bring to those rooms

From the planned agenda pre-work. Redact sensitive data.

| If you will discuss | Bring |
| --- | --- |
| OQ-001, OQ-002, OQ-011 | Scale tickets, certificates, current unit lists, one worked example |
| OQ-003, OQ-004, OQ-009 | Shop-floor step list, labels, residual/scrap examples |
| OQ-005 | QC forms, hold/release examples, who signs today |
| OQ-006, OQ-007, OQ-008 | Order, reservation, and shipment examples including partials |
| OQ-010 | Any portal promise already made to customers |
| OQ-012 | Accounting product name and a sample export |
| OQ-013, OQ-014 | Organization chart, site list, monthly counts if they exist |
| OQ-015 | Current stock list and how a count is done today |
| OQ-016 | Current backup practice, even if informal |
| OQ-019 | Real names and who may approve what |

## Constraint

This map is a collection aid. Agenda block 12 still applies: discussion does
not close an `OQ-*`. Outcomes must be written onto the register after the
Project Owner returns them.
