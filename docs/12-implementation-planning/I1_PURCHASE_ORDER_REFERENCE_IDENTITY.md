---
id: PLAN-I1-REFERENCE-001
title: R1 raw purchase reference and deterministic comparison key specification
phase: 12-implementation-planning
status: accepted
version: 1.1.0
owners: [chief-solution-architect, data-architect, security-architect]
depends_on: [APR-038, APR-037, APR-036, SRC-006, PLAN-I1-DOMAIN-001, PLAN-I1-API-001, PLAN-I1-DATABASE-001]
last_reviewed: 2026-10-21
approval: APR-037 accepted design; APR-038 bounded implementation authority
supersedes: null
---

# R1 identity design — OWNER-ACCEPTED DESIGN / I1 EXECUTION UNDER APR-038

Current implementation authority: [APR-038 actual Owner instruction](../00-governance/approved-baselines/APR-038-i1-implementation-authorization.md).
See [delivered code and actual validation](I1_IMPLEMENTATION_STATUS.md) and
[60-ID executable trace](I1_IMPLEMENTATION_TRACE.md). The accepted design content
below remains normative; its earlier design-only/no-execution statements describe
the APR-037 historical stage and are superseded only for bounded I1 execution.
No I2 authority or Owner capability acceptance is inferred.


Formal Owner design acceptance:2026-10-21, [APR-037](../00-governance/approved-baselines/APR-037-i1-detailed-design-acceptance.md),
reviewed content at9c0976e0519192358e8a097f7b26fe43f4b1df6e. The design below is
accepted with its recorded conditions; no code/SQL/API/permission/test execution
or product unlock is authorized. Future environment/parity/calendar/transaction/
security/regression verification remains mandatory, not completed evidence.

Business equivalence R1-A–D is OWNER APPROVED in
[SRC-006](../00-governance/team-answers/OWNER_R1_ORDER_REFERENCE_DECISION_2026-10-21.md).
The representation, function/column names and enforcement choices below are the
Owner-accepted I1-D02 design under APR-037, subject to its mandatory environment
and parity verification conditions. This is Markdown only, not executable SQL or source.
It replaces the previous exact-only PO branch; catalogue labels are unaffected.

## Ordered deterministic transformation

Accepted profile identifier: `PO-REF-R1-A-v1`. Input is the decoded raw field2
`orderReference`, not a numeric value, command target, supplier reference or label.
Apply the same finite operations for registration, lookup and owner key locking:

1. Validate type, validUnicode, API's explicit Cc/blank predicate and original raw
   size1–128Unicode scalars/<=512UTF8bytes before transformation. No truncation.
2. Remove the longest leading and trailing runs consisting ONLY of U+0020 SPACE
   from a working copy. Do not call JavaScript trim or a whitespace-class regex.
3. Map each ASCII U+0041–005A to corresponding U+0061–007A (A–Z to a–z).
4. Map U+06F0–06F9 and U+0660–0669 positionally to U+0030–0039. Latin digits stay
   unchanged. Do not parse a number or remove zeros.
5. Map U+064A to U+06CC and U+0643 to U+06A9. Already-Persian forms stay unchanged.
6. Copy every other scalar unchanged and retain its exact order. Require a nonempty
   result, <=128scalars/512bytes; return its UTF8 text as comparison key.

Each approved map is one-to-one or many-to-one per scalar, never deletion/expansion
except step2 boundary spaces; scalar/byte capacities cannot grow. A raw all-space
reference rejects before persistence; defensively reject an empty derived key too.
Blank/control rejection is input validity, not added equivalence: tabs/control
characters are invalid; NBSP around a nonblank reference is valid and significant.
No NFC/NFD/NFKC/NFKD, lower()/upper(), locale case conversion, accents, character
width/digit-value APIs, internal-space collapse, zero-width removal or fuzzy match.
Canonical JSON decoding makes literal/escaped encodings of the same scalar equal;
it does not apply Unicode canonical normalization. Key bytes use C collation.

| Synthetic input | Expected key / significance |
| --- | --- |
| ` PO-۱۲ ` / `po-١٢` / `PO-12` | All `po-12` |
| `ي-ك-۱۲` / `ی-ک-12` | Both `ی-ک-12` |
| ` PO-۰۱۲ ` | `po-012`, different from `po-12` |
| `PO12` / `PO/12` / `PO-1 2` | `po12` / `po/12` / `po-1 2`, all different from `po-12` |
| `PO-1` + U+200C + `2` | U+200C retained, distinct from `PO-12` |
| U+00A0 + `PO-12` + U+00A0 | NBSP retained; not `po-12` |
| `É-12` / `é-12` / `E`+U+0301+`-12` | Non-ASCII case/composition stay distinct; only ASCII E maps to e |

Raw accepted text stays in `order_reference`, returned unchanged in both authorized
order queries and included unchanged in owner/full-envelope binding. Comparison
key/profile are internal technical metadata, not additional entered factory fields
or public query parameters. No previous documentary record is reinterpreted.

## Accepted authoritative PostgreSQL generation

The accepted design uses a STORED generated `order_reference_key` text COLLATE C NOT NULL column,
derived only from raw `order_reference` by accepted versioned function
`procurement.po_reference_key_r1_v1`. `reference_key_profile` is fixed to the above
profile with a NOT NULL CHECK; it cannot partition uniqueness. The named immediate
`i1_po_reference_uq` is UNIQUE(installation_id,order_reference_key), not supplier,
raw reference, command key, creator, authority subdivision or profile version.

The small SQL-language function is IMMUTABLE, STRICT, PARALLEL SAFE, SECURITY INVOKER,
fixed `search_path=pg_catalog`, and calls only explicitly schema-qualified builtins:
first pg_catalog.btrim(raw, explicit U+0020), then explicit pg_catalog.translate
maps for ASCII uppercase, both digit sets, and Arabic Yeh/Kaf. Exact source/target
scalar lists have equal lengths; no translate deletion is possible. The transform
uses26ASCIIcase mappings,20digit mappings and2Yeh/Kaf mappings (48in total); each
translate source/target partition must have matching26/20/2scalar counts. UTF8 encoding
and C equality are fixed. No table reads, writes, runtime clock, network, locale
lower(), normalization extension or trigger rewriting raw text. This is an integrity
expression, not a stored business transaction/posting kernel.

STORED is explicit: PostgreSQL18 defaults to virtual generation, which has different
user-function restrictions. A supplied non-DEFAULT generated key is rejected by
PostgreSQL; owner INSERT omits the key/profile input and RETURNING verifies the DB
key equals the app-derived key before deciding success. A mismatch fails technically
and rolls back source/outcome/audit; never commits an accepted drifted order.
The key also has explicit nonempty/scalar/byte CHECKs. Invalid raw text fails its
own CHECKs; generated normalization is not a replacement for input validation.

Under later bounded implementation authorization, the migration owner creates/
freezes the v1 function; PUBLIC EXECUTE is revoked and only the restricted ERP
runtime/test role receives EXECUTE as needed for generation and query normalization,
plus SELECT/INSERT on the new sources as specified by the accepted design. No DDL/UPDATE/
DELETE/function replacement authority or SECURITY DEFINER. Actual shared DB role
limits still require owner SQL/import checks; new grants do not prove no foreign writes.

The app has its own explicit scalar-map implementation for bounded validation and
owner lock naming. Lookup also uses the DB v1 function on the raw parameter and
checks its key against the app result, then queries the trusted installation/
authority and unique generated key. No client key is accepted. All paths use the
same golden parity vectors before implementation acceptance. Parameterized SQL
and pre/post current authority checks remain. Query returns raw original, not key.

Alternatives: app-computed stored key + CHECK equality to controlled DB expression
is sound but adds an unnecessary caller-written column; app-only precheck/normalizer
cannot prevent drift/forgery or concurrent duplicates. An inline generated expression
avoids a function privilege but duplicates a long mapping across lookup and schema.
The versioned small function keeps one DB meaning for generation/lookup, with explicit
privilege/version obligations. APR-037 accepts this design; existing migration0012
is an integrity-function precedent, not authorization to implement this helper.
No helper or generated column has been created by this documentation task.
Primary mechanisms: [PG18 generation](https://www.postgresql.org/docs/18/ddl-generated-columns.html)
and [explicit trim/translate](https://www.postgresql.org/docs/18/functions-string.html).

## Mandatory environment verification before future implementation

I1-D02 acceptance is conditional on verifying the actual intended/supported
PostgreSQL environment before later authorized implementation begins. Confirm the
actual server version, UTF8/C behavior, STORED generation with the selected SQL
helper, IMMUTABLE/STRICT/PARALLEL SAFE/SECURITY INVOKER properties, fixed schema/
search-path conventions and necessary EXECUTE versus denied DDL/replacement rights.
The [database prerequisite](I1_PURCHASE_ORDER_DATABASE_DESIGN.md#mandatory-d02-environment-prerequisite)
records the same gate. Repository tooling expects PostgreSQL18.6; a static pin is
not verification of an intended or deployed server. No live database inspection,
function creation or compatibility probe is executed or claimed here. If later
verification finds an incompatibility, report and reconcile it before coding or
migration rather than silently changing the accepted mechanism.

## Locks, outcome binding and failures

Build owner resources from trusted scope, target UUID and derived key+profile
identifier; sort the complete actual signed hash key set using existing rules.
Equivalent spellings therefore contend on the same PO resource, while authoritative
unique persistence decides even if an advisory lock is omitted. Recheck current
authority after waits; post-wait READ COMMITTED sees the committed winner. If the
first transaction aborts, a waiting attempt may validly become the first registrant.

| Scenario | Accepted result |
| --- | --- |
| First valid unused target/key/reference identity | Accepted header+all lines+outcome+audit; raw reference retained |
| New command key and new target, same normalized reference | Durable GUARD_CONFLICT/HTTP422; no merge/overwrite; original raw unchanged |
| Concurrent equivalent references under distinct people/keys/targets | One committed order; loser GUARD_CONFLICT after wait or known23505 mapper; no duplicate sources |
| Same key, principal and identical original full input | Existing accepted/rejected outcome replay under current authority |
| Same key with equivalent but differently spelled raw reference | Existing full-binding conflict/HTTP409, not accepted replay |
| New key, same target, byte-identical original owner facts | Durable GUARD_IDEMPOTENT_DUP; no new source |
| New key, same target, changed raw reference even if equivalent | GUARD_CONFLICT because original owner facts changed |
| Lost/unknown COMMIT | Resolve original principal/scope/key/target/full raw payload on primary; no new spelling/key/ID or lookup substitution |
| Authorized lookup using equivalent raw variant | Same order UUID and original stored reference/specifications |
| Valid non-equivalent lookup | Its own scoped order if registered; otherwise generic not-found, never fuzzy/choose-first |
| Unauthorized/foreign lookup or supplied key/scope | Deny/absent safely per API; no comparison key/raw/creator leakage |

Kernel canonicalization/binding is never fed normalized replacement payload. R1 is
business source identity, not command equivalence. Owner binding also preserves
raw input. The existing23505 mapper rechecks the surviving normalized-key winner
under current scope/authority; unexplained/unknown constraints remain technical.

## Version and future change boundary

v1 meaning is frozen in app/DB profiles, migration checksum, fixtures and retained
raw bindings. No CREATE OR REPLACE semantic change, silent regeneration, profile-
partitioned uniqueness, backfill or replay reinterpretation. A future Owner change
requires explicit equivalence decision, collision analysis of existing operational
references, reviewed versioned schema/query/lock transition and coordinated rollout
before admission. Existing documentary references remain outside that transition.
Do not allow mixed app normalizer versions to admit simultaneously; a parity/profile
mismatch is an incompatible technical failure (HTTP503), before source acceptance,
not an admission-denied business guard or a new business identity.

Required future acceptance is detailed by R1-T01–R1-T12 in the acceptance plan.
No normalizer/source/fixture/test/migration was implemented or executed in this task.
