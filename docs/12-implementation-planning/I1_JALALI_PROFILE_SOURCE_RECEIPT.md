---
id: PLAN-I1-CALENDAR-RECEIPT-001
title: I1 finite Jalali profile source receipt and exhaustive verification
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [qa-architect, delivery-lead]
depends_on: [APR-037, APR-038, PLAN-I1-DOMAIN-001, PLAN-I1-ACCEPTANCE-001]
last_reviewed: 2026-10-21
approval: Technical evidence under APR-038; not Owner capability acceptance
supersedes: null
---

# I1 finite Jalali source receipt — UT-JALALI-1206-1498-v1

This receipt supports accepted I1-D05 and A08/A09. It introduces no new factory
policy, date range, calendar algorithm or dependency. The accepted scope remains
Jalali1206–1498 inclusive; meaningful dates outside that profile receive
I1_DATE_OUTSIDE_PROFILE rather than conversion, clamping or a current-date default.

## Frozen primary source

- Source: University of Tehran Institute of Geophysics Calendar Center,
  [published common/leap-year table,1206–1498](https://calendar.ut.ac.ir/documents/2139738/7092644/Kabise%2BShamsi%2B1206-1498.pdf/fbc45bf4-df46-c298-381c-2bff2c57f0e0?t=1719740029743).
- Retrieved:2026-10-21;103565bytes;11PDFpages.
- Exact PDF SHA-256:
  `d897b960b46992226502a21e24c604db9f87cf68fa43f8df368316bee386475e`.
- The Persian legend identifies one star/green as a four-year leap marker and
  two stars/yellow as a five-year leap marker. Both designate leap years.
- The source describes Calendar Center research/calculation results. This finite
  versioned profile does not assert that every future civil calendar is enacted.
  A later authoritative conflict must be reconciled before affected use; no quiet
  change to stored historical dates or automatic range extension is permitted.

## Independent full-profile verification

The complete Jalali year column was extracted locally from the verified PDF:
293rows are consecutive1206through1498, with71marked leap years and222common years.
No Gregorian-column date arithmetic or third-party calendar algorithm supplied
these flags. The original Gregorian columns are not the leap oracle.

A separate pass matched every year-row center to the PDF's green/yellow vector
background rectangles, independently of the extracted star suffix. All293star/color
classifications agreed. A rendered contact sheet of all eleven original year
columns was visually inspected against the original legend: ten pages contain
29rows/7leaps each; page11contains3rows/1leap. This includes every common year,
not merely a few familiar leap examples.

The independent test oracle stores one ASCII bit per year in ascending order,
1for either leap marker and0for no marker. It was frozen separately from the
runtime leap-year list. Concatenating the page flags below gives293bytes and SHA-256
`03373be93f3d27203992f4f5d9e017e08ede011e6b08c3d3ef9208a3c87f6b57`.

| Original page | Consecutive Jalali years | Exact source flags | Leap count |
| --- | --- | --- | --- |
| 1 | 1206–1234 | `00001000100010001000100010001` | 7 |
| 2 | 1235–1263 | `00010000100010001000100010001` | 7 |
| 3 | 1264–1292 | `00010001000010001000100010001` | 7 |
| 4 | 1293–1321 | `00010001000100001000100010001` | 7 |
| 5 | 1322–1350 | `00010001000100010000100010001` | 7 |
| 6 | 1351–1379 | `00010001000100010001000010001` | 7 |
| 7 | 1380–1408 | `00010001000100010001000100001` | 7 |
| 8 | 1409–1437 | `00010001000100010001000100010` | 7 |
| 9 | 1438–1466 | `00010001000100010001000100010` | 7 |
| 10 | 1467–1495 | `00100001000100010001000100010` | 7 |
| 11 | 1496–1498 | `001` | 1 |

The nine double-star years are1210,1243,1276,1309,1342,1375,1408,1441,1474.
The [official annual1404publication](https://calendar.ut.ac.ir/documents/2139738/7092644/Calendar-1404.pdf/4321b7e0-d043-78ca-49f5-fbfc911e7901?t=1729620775906)
independently identifies1403-12-30; this checks the current leap boundary without
turning that annual document into an oracle for all future years.
The retrieved PDF, extracted row receipt and visual contact sheet are retained only
in ignored local `artifacts/tests/i1-environment/`; runtime uses no network or PDF.

## Executable evidence and separation from stock

[Pure validators](../../apps/backend/src/modules/procurement/inbound-values.ts)
store the immutable71year list and explicit calendar-profile identity.
[Independent unit cases](../../apps/backend/tests/unit/inbound-values.test.ts)
compare that list against all293source flags, enumerate all107016supported valid
days, check exact component/string roundtrip and frozen results, and reject every
month/day boundary outside its permitted length for every year. Additional cases
cover1394/1395/1403/1404Esfand, range endpoints, unsupported1205/1499, malformed
ASCII syntax, Unicode digits, line terminators and timezone-like suffixes.
Neither JavaScript Date nor PostgreSQL DATE interprets the business date.

The same unit file also verifies all48finite R1character mappings and significant
unapproved variants, exact source-text/scalar/byte validation, positive20/18decimal
limits, positive20digit whole W1/count, safe40digit Procurement-only BigInt totals,
and rejection of trailing newline/oversized numeric strings. No quantity is
converted through binary floating point or work proportional to ordered count.

Executed using the local exact Node24.21.0 on Windows:

- `tsc -b --pretty false`:PASS at the time of the scoped run.
- Scoped ESLint with zero warnings:PASS.
- `node --test apps/backend/dist/tests/unit/inbound-values.test.js`:
  **7tests PASS,0failed,0skipped**.

This is source/unit evidence only. Application/database profile parity and direct
PostgreSQL invalid-row enforcement require the actual integration suite; this
receipt does not claim those unreported results, I2 receiving behavior, factory
UAT, production deployment or Owner acceptance of a twelfth backend capability.
