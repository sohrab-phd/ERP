---
id: ASM-SOURCES-001
title: Project Assimilation Source Bibliography
phase: 01-project-assimilation
status: in_review
version: 0.1.0
owners: [chief-solution-architect]
depends_on: [SRC-001, SRC-002]
last_reviewed: 2026-09-02
approval: null
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
- [Cross-source reconciliation](RECONCILIATION.md)
- [Canonical Source Register](../00-governance/SOURCE_REGISTER.md)

The source documents outrank derived summaries if a discrepancy is discovered.
Conflicts are recorded rather than silently resolved.
