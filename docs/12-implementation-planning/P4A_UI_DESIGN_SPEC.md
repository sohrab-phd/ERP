---
id: IMPL-P4A-UI-SPEC-001
title: P4a native Warehouse Inventory UI specification
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [delivery-lead, frontend-engineer]
depends_on: [APR-048, PLAN-P4A-READS-001]
last_reviewed: 2026-11-05
approval: null
---

# Native Warehouse Inventory interface

Scope: the approved P4a Inventory-only WH journey; no commercial documents, stock
commands, totals, sorting, export, general history or role expansion. The approved
[read contract](P4A_INVENTORY_READ_CONTRACT_DESIGN.md) and APR-048 control semantics.

## Existing shell evaluation and skill use

P1/P2 use native HTML/CSS/TypeScript, Persian RTL, Tahoma/Segoe UI at16px and1.8
line height, dark green navigation, pale green table headers, white bordered
sections,44px controls and visible keyboard focus. Keep that visual language and
existing recovery controls. Existing wide tables need bounded horizontal scrolling;
P4a supplies responsive row layouts on narrow screens with the same semantic
table and labelled data. No replacement of P1/P2 forms or layout is required.

Read installed ui-ux-pro-max SKILL.md, quick-reference and pro-rules. Local
non-persisting searches: `error summary validation` gives the web Focusable Error
Summary rule; `focus not obscured` gives the enhanced focus guidance (not claimed
as AA certification); `minimal flat interface --domain style --rtl=full` gives
Minimalism & Swiss Style with full RTL compatibility. The design-system query
`warehouse inventory table` was evaluated as advisory only; generated landing-page
patterns, palettes/font imports and framework examples do not replace the accepted
ERP shell. Native/mobile-only pro-rules are not applied as desktop platform rules.

## Small shared visual specification

- Reuse existing typography, light scheme, green primary/secondary buttons,44px
  hit areas,8px corner surfaces, semantic focus/error/success colors and spacing.
  New Inventory styling is scoped to its panel and uses shell-matching tokens.
- Show eight exact filters, five primary and UUIDs in progressive advanced disclosure.
  No field normalization. Search and clear actions are visible; page size25(default),
 10or50 starts a new traversal. Never require UUID before default discovery.
- Dense desktop table exposes code, stored kind, state, actual location, three exact
  kg quantities and origin. Additional actual identifiers are expandable. Mobile
  rows retain labels/values, wrapping long identifiers rather than hiding them.
- Unit detail distinguishes current quantities from initial source weight/count/
  original production disposition. Lot navigation lists associated Units without
  aggregate weight; CONSUMED/SHIPPED explicitly historical and zero stock.
- Use Persian digits/grouping through string operations, preserving every accepted
  fractional digit and >2^53 integer value. UUIDs use isolated LTR; arbitrary codes
  use isolated auto direction. No innerHTML or lossy Number conversion.

## Interaction, access and evidence

Real forms/buttons/headings/table captions/column scopes, polite status and alert
errors; visible labels, inline field errors and focusable multi-error summary.
Enter submits, Tab order follows reading order; headings receive navigation focus,
Back returns to the source action where available. Focus remains unobscured, text
wraps under zoom, state text accompanies color and reduced motion is respected.

Per-page observation/freshness warning and explicit arithmetic-unreserved warning
are always present with successful data. Loading/empty/no-authorized-result/error/
invalid-cursor/hot-Unit-overflow messages never imply a write occurred. Duplicate
paging/refresh controls disable while pending; editing filters cancels ownership
of an old request. Refresh starts page1 with the current applied filters.

Inventory requests use the existing authenticated same-origin/no-store/CSRF wrapper
plus AbortSignal, session epoch and Inventory view/request generation checks. No
old response/focus/error can overwrite a new view. Hide aborts pending requests;
logout/role/actor/session loss clears all Inventory rows, filters and cursor history.
Nothing is stored in browser storage/URLs. Existing P1/P2 pending intents remain
owned by their accepted encrypted recovery flow, never Inventory replay.

Actual Chromium verification, measured contrast/focus/responsive behavior and
acceptance evidence are required after implementation; this specification does
not claim those checks have already passed or Owner product acceptance.
