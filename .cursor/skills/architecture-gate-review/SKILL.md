---
name: architecture-gate-review
description: Evaluates a Foolad Navardkaran architecture phase for completeness, canonical consistency, traceability, unresolved blockers, review evidence, and implementation authorization. Use when conducting a formal phase or final architecture gate review.
disable-model-invocation: true
---

# Architecture Gate Review

## Scope

Review architecture evidence only. Do not implement fixes as application code and
do not grant human approval.

## Required inputs

1. Read `docs/00-governance/CURRENT_PHASE.md`.
2. Read the target phase `README.md` and exact artifact list.
3. Read applicable canonical registers under `docs/00-governance/registers/`.
4. Read prior approval manifests and dependencies.
5. Read the phase self-check, independent review, and reconciliation evidence.

## Review procedure

1. Verify entry and exit criteria with direct artifact evidence.
2. Check all required frontmatter, IDs, versions, owners, dependencies, and status.
3. Detect duplicated or conflicting canonical definitions.
4. Check bidirectional traceability for the phase's maturity level.
5. Confirm state, invariant, ownership, data, interface, security, and test
   artifacts agree where applicable.
6. Confirm happy paths, exceptions, reversals, concurrency, failure, and recovery
   behavior are not silently omitted.
7. Confirm in-scope blocking questions and Critical/High findings are closed.
8. Confirm residual risks have owners and explicit acceptance authority.
9. Identify material upstream changes and downstream artifacts requiring reopen.
10. Verify no prohibited implementation artifact was created.

## Output

Return:

- Verdict: `BLOCKED` or `READY_FOR_HUMAN_APPROVAL`
- Scope and evidence reviewed
- Satisfied exit criteria
- Remaining blockers
- Findings and traceability gaps
- Residual risks/deferrals
- Downstream impact
- Exact next permitted action

`READY_FOR_HUMAN_APPROVAL` is not approval. Only the user may approve a gate.
