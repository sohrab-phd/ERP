---
id: ASM-SOURCES-001
title: Project Assimilation Source Bibliography
phase: 01-project-assimilation
status: approved
version: 0.2.1
owners: [chief-solution-architect]
depends_on: [SRC-001, SRC-002, ASM-PROVENANCE-001, ASM-METHOD-001]
last_reviewed: 2026-09-04
approval: APR-003
supersedes: null
---

# Project Assimilation Source Bibliography

## Primary sources

### SRC-001

[گزارش معماری و طراحی تفصیلی.docx](D:/projects/NavardKaran/Docs/گزارش%20معماری%20و%20طراحی%20تفصیلی.docx)

- Read completely through read-only in-memory DOCX XML extraction.
- Treated as the proposed architecture and detailed-design baseline.
- Its unresolved workshop questions and proposed decisions remain unapproved.

### SRC-002

[پرامپت جامع نسخه ۲ (1).docx](D:/projects/NavardKaran/Prompts/پرامپت%20جامع%20نسخه%20۲%20(1).docx)

- Read completely through read-only in-memory DOCX XML extraction.
- Treated as the architecture-analysis, multi-agent responsibility, artifact,
  review, and validation methodology.

## Binding override

The backend technology family is Node.js + TypeScript. References to .NET,
ASP.NET Core, C#, SignalR, Hangfire, Quartz.NET, or other .NET implementation
mechanisms are interpreted as legacy/comparative concepts requiring deliberate
Node-compatible mapping.

This override does not automatically approve NestJS, Prisma, Socket.IO, a job
scheduler, an authentication package, or any other implementation choice.

## Derived evidence

- [Architecture Assimilation Report](ARCHITECTURE_ASSIMILATION_REPORT.md)
- [Provenance and Claim Classification](PROVENANCE_CLASSIFICATION.md)
- [Multi-Agent Architecture Analysis Method](MULTI_AGENT_METHOD.md)
- [Planned Discovery and Validation Workshop](WORKSHOP_AGENDA.md)
- [Cross-source reconciliation](RECONCILIATION.md)
- [Canonical Source Register](../00-governance/SOURCE_REGISTER.md)

## Claim-level source limitation

The DOCX sources were read through read-only, in-memory XML extraction. The
extracted text did not provide a trustworthy stable mapping to rendered page
numbers or original paragraph identifiers. The provenance record therefore maps
major report sections and claim groups to SRC-001/SRC-002 and a claim class; it
does not claim unavailable paragraph/page precision.

Direct binary-source re-extraction was not performed during these corrections.
If later review needs exact quotations, formatting context, tables, comments,
headers/footers, or rendered pagination, the binary sources must be re-extracted
and the resulting evidence registered without retroactively fabricating
citations.

The source documents outrank derived summaries if a discrepancy is discovered.
Conflicts are recorded rather than silently resolved, and source proposals do
not become decisions without accepted authority.

## Approval status

APR-003 approves this bibliography as an accurate Phase 01 source-accounting
record at the stated extraction granularity. It does not approve source
proposals, detailed design, or technologies. The Phase 01 checkpoint and commit
remain pending, Phase 02 remains inactive, and implementation remains
unauthorized.
