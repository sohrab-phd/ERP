---
id: APR-020
title: Inventory posting kernel implementation scope
status: approved
last_reviewed: 2026-10-07
approval: Project Owner explicit current Codex message
---

# SLICE-IPS scope authority

The Owner states that accepted commits were pushed and explicitly directs:

> Continue ERP implementation with the next approved slice: SLICE-IPS

This transcribes the actual message, not an agent-generated signature. Recording
is also covered by APR-019's bounded backlog-progression delegation. Starting
HEAD is 739895d76f4e621c8c10b37c630fba7af47f6da2; accepted Identity commit is
e977b64ab5ac3687c6f0f41d4b0c5a317b2c6314. Original approved architecture
baseline remains APR-018/e80a04b15ddf93451cc79ccf81722f564912596d.

Scope: approved backlog capability3, sole Inventory Posting Service/kernel,
Ledger source truth, rebuildable Balance, kg exact arithmetic, nonnegative
quantities, concurrency, current authorization and envelope/audit integration.
Only internal owner ports needed by later receipt/reservation workflows; no
generic user stock-update endpoint, full Inventory/Procurement/Sales/Production,
QC, opening-stock, conversion policy, portal or unrelated business workflow.
No OQ/business answer is invented. Stop after accepted documented/tested/reviewed
local commit for Owner push; do not push or begin the next major slice.
