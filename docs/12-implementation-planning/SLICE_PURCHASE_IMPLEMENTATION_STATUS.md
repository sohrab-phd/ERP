# SLICE-PURCHASE purchasing increment — actual implementation

Delivery date: 2026-10-10. Status: engineering ACCEPTED — Definition of Done passes,
no blocking/required or known high/critical finding remains. Owner acceptance/push
is pending the reported local delivery commit; no human UAT approval is fabricated.
Authority/policy: [APR-027](../00-governance/approved-baselines/APR-027-purchasing-evidence-scope.md).
Starting accepted/pushed commit:601e52a02430ee3f81b737c1b8ffdabc2123b63c.
[Plan/DoD](SLICE_PURCHASE_PLAN.md) binds scope; architecture APR-018 unchanged.

## Delivered responsibility and contracts

Procurement records completed purchase evidence independently of receipt, then
optionally records that a related purchase proforma was already sent. This covers
the approved recording part of Ms. Masoumi's workflow. Personal names confer no
authority; ACT-SEC configures actual individual organizational ACT-PROC grants.
There is no new approval hierarchy or mutable procurement state machine.

| Route | Command/query and payload |
| --- | --- |
| POST /purchasing/purchases | RecordCompletedPurchase v1; purchase-record UUID target; purchaseDocumentReference, supplierReference, purchaseDate, materialDescription |
| POST /purchasing/proformas | RecordPurchaseProformaSent v1; purchase-proforma UUID target; purchaseId, proformaReference, sentDate |
| GET /purchasing/purchases/{uuid} | GetCompletedPurchase: immutable purchase facts, issuer/subject/recordedAt |
| GET /purchasing/proformas/{uuid} | GetPurchaseProforma: linked sent-document facts, issuer/subject/recordedAt |

Empty command preconditions and closed payload schemas; references nonempty safe
Unicode <=128 UTF-8 bytes, description <=512 bytes, real YYYY-MM-DD calendar dates
in years0001–9999. No chronological/future-date restriction is invented. Supplier
reference is descriptive evidence, never a Supplier master/selection/approval.
No quantity, money, payment, status, actor override, stock or PO fields accepted.
Multiple records/references may describe different documents; the software does
not guess natural duplicates. Sent evidence is optional and may be added later;
the exact scoped purchase must exist. There is no one-proforma-per-purchase rule.

Both queries/commands require current individually authenticated, service-branded
ACT-PROC without customer scope and exact installation/authority. Other roles,
customer-bound Procurement, copied/forged/revoked contexts cannot access records.
HTTP uses personal Bearer sessions and optional ACT-PROC selector, never a role
claim. Origin-bearing requests denied; no cookies/browser UI. Existing body4096
bytes, duplicate-safe bounded JSON,16 active operations, transaction/HTTP deadlines
and safe/no-store errors apply. Queries disclose no internal binding or credentials.

HTTP200 accepted/replayed or read;422 durable business rejection/replay;409 bound
key conflict;403 admission/current permission denial;401 invalid session;400 bad
transport;404 missing scoped document;405 unsupported method;503 technical/uncertain.
Each POST route permits only its matching command. Technical uncertainty requires
retry with the same target UUID and key. Default recovery admission fence remains.
An unreconciled/default-fenced primary returns503 technical incompatibility and
does not commit a fact or outcome; it is not an authority rejection.

## Persistence, integrity and ownership

Migration0015 adds procurement.completed_purchase and procurement.purchase_proforma_sent.
Scoped composite primary keys and the proforma-to-purchase FK prevent foreign
references. Real DATE and byte limits, ACT-PROC attribution and DB recorded_at
constrain facts. Both retain actual issuer/subject/request/key; runtime SELECT/INSERT
only, with no UPDATE/DELETE or DDL ownership. Previous migration raw checksums and
all dependencies/root script bodies remain; test/migration inventories add this slice.

Envelope key -> account/session -> scoped evidence advisory lock -> fresh READ
COMMITTED lookup -> immutable insert -> outcome/audit is one transaction. Authority
is rechecked after waits. Same UUID under a new key yields equal DUP or changed
CONFLICT. Same bound key replays accepted AND rejected results without a second fact;
changed intent/principal conflicts. Handler savepoint business rejection preserves
only the durable rejection/audit; technical/audit failure rolls everything back.
Uncertain COMMIT recovery uses the existing primary/key, never a new document ID.

This owner has no receiving/Inventory/Finance/Sales/Production port and no foreign
table SQL. Recorded purchases/proformas cannot create Lot/Unit, alter kg, approve
supplier/payment, fulfill demand or close Sales. Existing PostGoodsReceipt remains
the sole intake path; no mandatory purchase/receipt link is introduced.

## Acceptance evidence and independent review

Final root-executed pinned `npm run verify` PASS:170 unit and240 actual native
Windows PostgreSQL18.6/UTF8 integration tests, zero failures/cancellations/skips.
This includes11 purchasing units,22 purchasing database cases and2 composed HTTP
cases, plus all prior capability regressions. Integration duration849946ms.

| Proof | Executed/assessed scope |
| --- | --- |
| Unit purchase tests (11) | Closed fields, real calendar dates/UTF8 byte limits, C0/C1 control rejection, immutable snapshots, optional later proforma, exact duplicate/conflict guards, organization/current-role denial, safe read attribution |
| PostgreSQL purchase tests (22) | Both commands' accepted/rejected replay, principal/intent conflicts, distinct-person document-lock DUP/CONFLICT races, actual insert/business/technical/audit rollback, confirmed COMMIT-reply loss, scoped missing/foreign purchase refs, branded customer grant denial, envelope-lock logout during new/replay, source privilege/FK/check enforcement |
| Composed HTTP purchase tests (2) | Personal org ACT-PROC happy path and current reads, replay/status contracts, bad auth/role/route/Origin/JSON/body denial, default recovery fence, real customer-only grants denied on admission-enabled host, zero foreign writes |
| Previous committed regression suites | PASS: Envelope, Identity, IPS, receipt, Sales, reservation, shipping, production, genealogy and fresh/restart/checksum migration checks |

| Final check | Executed result |
| --- | --- |
| Frozen runtime preflight | PASS: Node24.21.0/npm11.19.0/TypeScript6.0.3/pg8.23.1 |
| Formatting, ESLint, module boundaries, emitted build/typecheck | PASS through npm run verify and standalone npm run build;129 source/test files in ownership check |
| Relevant units / complete unit suite | 11 purchasing cases /170 total PASS, zero skips |
| Real database/HTTP / complete integration suite | 24 purchasing cases /240 total PASS, zero skips; distinct restricted runtime and DDL-owner roles, acknowledged isolated test DB and separate dev DB |
| Canonical consistency | 16 changed Markdown pages/955 local references and13 tracked JSON files PASS; gate/local unlock match APR-027 |
| Frozen prior files | All14 previous raw SQL migrations and4 dependency/workspace manifests unchanged byte-for-byte; root scripts/dependencies unchanged |
| Graph/navigation | Offline pinned Graphify0.9.79 refresh and PurchaseService query link composition, public Procurement contracts, owner store and tests; extractor omissions are not semantic evidence |
| Git whitespace/scope | Working and staged git diff --check PASS; reviewed coherent purchasing-only diff, no credentials/local unlock/generated data staged |

Independent static reviews: purchase_security_review inspected all code, tests and
canonical security/contract/ownership documents, having authored none. The
purchase_scope_review agent independently reviewed source/migration/HTTP/composition
and PostgreSQL/HTTP tests, excluding its own authored unit tests/runner (reviewed
by the security reviewer). Both conclude PASS with no outstanding blocking/required
or known high/critical finding. No independent database execution is claimed;
runtime acceptance comes from the root's pinned Windows run. An agent's diagnostic
unit run under PATH Node24.13 is excluded; required unit proof is pinned Node24.21.

Required findings closed: preserve Identity's trusted frozen context identity;
reject C1 control characters consistently with the approved safe-text contract;
prove customer-bound access denial independently of the recovery fence using a
genuine branded current grant; update both migration-count assertions to15.
The test fixtures now distinguish shared temporary-context admission errors from
module authorization guards and close each app pool once. No business-policy
expansion or lowered acceptance requirement was used to fix them.

Security checks assess current personal RBAC/organization scope, copied contexts,
parameterized SQL, mass assignment, durable binding/replay, races, atomic audit,
immutable least privileges, minimized disclosure and request/transaction bounds.
No browser renderer, cookies, uploads, external sending/outbound URLs or new
credential storage exists in this increment; XSS/file handling/SSRF are therefore
outside its changed surface. Dependencies/lockfile unchanged; no dependency
advisory refresh or external source/metadata export is performed or claimed.

Test environment recovery restored missing timezone abbreviation data from the
retained locally checksum-verified PostgreSQL18.6 archive (SHA256
983ee554ec53dbeb9b70797bef9fcf4e67e117e7e48ca1463cc80b3ff8e8ff3f) and recreated
missing empty runtime directories listed by that version's initdb source. No
replacement server version, installer/ACL work, Linux or production reset. The
ACK-gated isolated test DB had stale prior test migration evidence; root reset it
through the canonical disposable-database safeguard before the fresh suite.

## Limits and next work

Backend record-and-evidence increment only: keyed internal reads, no browse/search
UI, attachments, outbound sending, supplier catalogue, PO approval/lifecycle,
commercial terms/quantities, purchase selection/request, mandatory receipt/demand
link, partial/over/under receipt, cancellation/return/correction or new genealogy
source. Deferred branches remain subject to actual factory answers and scope.

After accepted local commit stop for Owner acceptance/push. Next backlog area is
Finance-Lite, depending on Sales/Identity and genuinely unresolved commercial/
payment recording/allocation policy. Naming it is not authorizing implementation.

## Overall committed capability progress

The local delivery commit completes the tenth major capability; its hash is
reported in the delivery message to avoid a self-referential document hash.

1. SLICE-ENVELOPE foundation — durable bound commands, PostgreSQL transactions,
   atomic outcomes/audit and host health.
2. Identity/authorization foundation — personal accounts, revocable sessions,
   explicit grants and security administration.
3. SLICE-IPS — sole exact-kg Ledger/Balance posting kernel, no negative stock.
4. SLICE-PURCHASE receipt increment — atomic manual receipt, Lot/Unit origin and stock.
5. Sales stock-demand increment — scoped demand/fulfillment and confirmation.
6. Reservation increment — customer-bound requests/activation with serialized demand priority.
7. Shipment increment — complete reserved-Unit packaging/loading/atomic dispatch.
8. SLICE-MAKE — routed production, exact mass balance, WIP/final and immutable source facts.
9. Genealogy — bounded source-backed bidirectional customer-scoped trace.
10. SLICE-PURCHASE purchasing increment — completed-purchase and optional sent-proforma evidence.

The backend now supports intake, stock demand, reservations, dispatch, routed
production and material trace, plus documentary purchasing coordination. Actual
personal grants/catalogue setup, factory UAT and production cutover are separate.
Browser workflows and complete commercial/financial policy are not delivered.
Remaining major areas: Finance-Lite; weighbridge/device adapter; portal visibility
and reporting/UI; source-linked correction/restore; factory UAT and cutover.
Current-MVP QC and portal ordering remain excluded.
