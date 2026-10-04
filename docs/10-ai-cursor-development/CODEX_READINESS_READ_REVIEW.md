---
id: AI-CODEX-READ-REVIEW-001
title: Codex Governance Read Boundary Review
phase: 12-implementation-planning
status: in_review
version: 0.4.0
owners: [chief-solution-architect]
depends_on: [ADR-0009, AI-AUTH-001, PLAN-READY-001]
last_reviewed: 2026-10-03
approval: null
supersedes: null
---

# Codex governance read boundary review

## Current status — namespace-control redesign not approved (2026-10-04)

NATIVE AUTONOMY TRANSITION: NOT SAFE

The preceding administrator action failed safely before transition:
PRIMARY FAILURE: Existing ancestor permits supervisor substitution
D:\projects\NavardKaran 65536; shared ancestors will not be modified.
All older READY statements, checksums and execution commands in the installer
are superseded as release instructions. Do not execute them. The canonical installer status above its historical release text is NOT SAFE. No superseding
administrator action is approved or issued by this review.

The current payload remains unchanged and fail-closed; its shared-ancestor
assertions have not been removed without replacement enforcement. No administrator
execution, ACL/owner changes, gate/unlock changes or product implementation were
performed during this review. D:\, D:\projects and D:\projects\NavardKaran
remain outside the permitted mutation boundary.

Independent namespace_windows_semantics, namespace_anchor_design and
namespace_source_review found the same unresolved invariant: after installer exit
and restart, an ordinary supervisor holding shared-parent namespace mutation
rights must remain unable to substitute another directory at the canonical
repository pathname and bypass Tier-0 or product-write enforcement.

A repository-root nonfollowing, non-delete-sharing handle plus volume/device,
file ID, canonical path, reparse status and owner/security pins can strengthen
installation-time checks. Its protection ends when its handle is released.
An explicit DELETE deny on the root alone is not proof against parent-mediated
FILE_DELETE_CHILD or renaming a shared ancestor. Current PathIdentity opens and
closes its handle and is evidence, not a persistent lease.

A protected %ProgramData%\CodexNativeAutonomy identity/gate anchor is proposed
only; it would require an independently enforced consumer before every relevant
runtime operation. The mutable .codex adapter, a repository-substitutable .cursor
verifier and install-time checks cannot supply that consumer. A restarting task
or service that merely retains handles has an unprotected crash/restart interval
unless a separate mandatory fail-closed enforcement mechanism is proved. No such
supported persistent mechanism is installed or verified in this design.

Obsolete ancestor-right checks are in SupervisorAncestorDenials, Collector.Serve
and the child ProbeSource. Retire their ACL-denial assumptions only together with
a proved independent persistent boundary. Ancestor identity/ACL capture and
installer non-mutation checks remain read-only environmental evidence. Future
root/child pins and delete/rename/move/replace/reparse/alias/unlock/DACL/hook
attack tests must cover the post-exit/restart boundary, not just the period while
installer handles are retained.

implementationAuthorized=false; approvedBaseline=null; final unlock absent.
ERP implementation remains locked. This is an unfinished pre-implementation
security design, not an implementation authorization or an installed transition.

---

## Previous release (superseded): kernel-bound bootstrap-process provenance (2026-10-04)

NATIVE AUTONOMY TRANSITION: READY FOR ONE-TIME ADMIN EXECUTION.
Current normalized UTF-8/LF payload SHA-256:
`4843d268ab611d2fe1c11038c130bbe5fd342415b445ac15127733025804b896`.
The previous command and checksum are superseded. Installation is not yet verified.

The Project Owner reported safe preflight failure: PRIMARY FAILURE: Wrong bootstrap
process. The revised CaptureFrontend removes all textual CommandLine matching
and arbitrary powershell.exe polling. A protected CREATE-only scheduled task
(flags 18) returns the exact running instance GUID/path and engine PID. Its
nonce-bound named-pipe peer PID is authenticated through retained process/query
token handles, exact unelevated frontend SID, kernel image resolution, pinned
Windows PowerShell canonical path/file identity/local NTFS/SHA-256, and the
unchanged bootstrap script SHA-256. Token duplication follows every assertion and
uses the same verified process handle. A task host is accepted only as a fresh,
exclusive, protected SYSTEM engine with a direct kernel-parent link; ambiguous or
shared engines fail closed. An unrelated same-user PowerShell cannot satisfy this
binding. PowerShell is resolved from native GetSystemDirectory, never PATH.

Task ownership is recorded immediately after successful CREATE, before fallible
COM getters. Partial metadata still binds cleanup to exact task path and nonce.
Cleanup stops only owned queued/running instances and independently attempts
owned registration deletion. Only authenticated peers enter the retained-handle
cleanup list. Constructor/finalizer warnings cannot replace the primary failure.
Shared NativeTransitionState preserves token/collector/counter state when the
wrapper invokes the payload in its child scope.

Final independent static reviews: peer_final_security, peer_final_powershell,
peer_final_scope_cleanup and peer_final_wrapper: PASS. Earlier findings on immediate ownership tracking,
principal ACE suppression, queued shutdown, independent unregistration, constructor
error preservation and W API exact spelling were corrected before these reviews.
Complete parse, Add-Type and real task/ACL behavior remain fail-closed admin-time
assertions. Parser proof remains recorded transactionally by the checksum-bound
one-shot wrapper; no payload runs before checksum and complete parse pass.

Highest persistent repository ACL/owner object remains
D:\projects\NavardKaran\Design-ERP. Ancestors stay read-only, private evidence
stays under %ProgramData%\CodexNativeAutonomy, installed executables stay read-only,
repository/Tier-0 Plain stays strict, and tracked nonfollowing junction cleanup
remains mandatory on success/rollback. Gate readback is false/null. No unlock,
human approval, installed-state claim or ERP implementation was created.

The single superseding human command is the current action at the beginning of
install-native-autonomy-transition.md. After actual INSTALLED AND VERIFIED,
resume the persisted master objective; no further Tier-1 micro-permissions.

## Previous release (superseded): read-only installed-executable resolution repair (2026-10-04)

NATIVE AUTONOMY TRANSITION: READY FOR ONE-TIME ADMIN EXECUTION.
Current normalized UTF-8/LF payload SHA-256: `4e424205e002f91816b40f15925049569e872bb9467b9e5e517edc55fefc19b9`.
The previous command and checksum are superseded. Revised installation remains
unexecuted; no installed-state claim is made.

The Project Owner reported the previous one-shot preflight failed before the
persistent transition: "Reparse ancestor C:\Users\Cyber Power\AppData\Local\Programs\OpenAI\Codex\bin",
followed by "Argument types do not match". No installation-path filesystem or
ACL workaround is authorized or performed.

Only installed Codex discovery uses the new native read-only executable resolver.
CreateFile follows Windows reparse resolution; final DOS/NT paths, disk-file type,
regular-file attributes, direct fixed local NTFS volume, volume/file identity and
SHA-256 from the same held handle are bound. Read sharing excludes write/delete
sharing. Original and canonical paths plus held content are rechecked before
every Launch. The private probe copy comes from that handle and is separately
identity/hash pinned. Loops, inaccessible targets, UNC/network and unexpected
devices fail closed. Shim discovery is bounded to an adjacent native executable;
arbitrary recursive executable searches are retired.

Repository/Tier-0/configuration/private evidence Plain remains byte-for-byte
unchanged. Codex installation files, owners and ACLs are never modified.
Repository ancestors remain read-only; the highest repository mutation object is
D:\projects\NavardKaran\Design-ERP. Private evidence stays under
%ProgramData%\CodexNativeAutonomy. Verified nonfollowing junction deletion on
success and rollback remains mandatory.

Affected generic-list conversions now use ToArray. StopTests verifies task
removal and process exit. A pre-change failure prints PREFLIGHT FAILED and the
unchanged PRIMARY FAILURE before separately labeled CLEANUP WARNING messages.
Token/lease finalizers cannot replace that result. Native RunUser retains its
primary exception and attaches isolated cleanup warnings; a never-assigned proof
process is also terminated. Collector disposal cannot replace launch failure.

Independent static results: resolved_executable_static_review,
cleanup_fixed_static_review, probe_cleanup_final_review and
pin_and_cleanup_final_redteam returned PASS. A red-team finding on native-process
finally masking was repaired and re-reviewed. These are static results, not live
execution/compilation evidence. Mandatory whole-payload parsing remains before
execution and is recorded in PreExecutionParse in the transactional receipt by
the unchanged reviewed wrapper, bound to this new checksum.

Gate remains false/null; no final unlock or ERP implementation was created.
A fresh session must wait for actual INSTALLED AND VERIFIED evidence before
claiming the native transition, then resume the repository master objective.

## Previous release: mandatory human-runtime pre-execution parse (superseded)

NATIVE AUTONOMY TRANSITION: READY FOR ONE-TIME ADMIN EXECUTION.
This is a prepared, statically reviewed action, not an installed transition or
human implementation authorization. The Project Owner directed that complete
parse validation run inside the one-time administrator preflight; the previous
session's parser denial is not a separate human-access prerequisite.

The exact payload remains unchanged at normalized UTF-8/LF SHA-256
`abab8c8f3cf42d24128341a278476ffa6826a41b522520feb701b2a643de570b`.
The single command is recorded in install-native-autonomy-transition.md.

The wrapper sets ErrorActionPreference=Stop, reads the exact local Markdown,
requires one powershell fence, normalizes CRLF to LF and TrimEnd plus one LF,
hashes UTF-8 bytes, compares the SHA-256 with StringComparison.Ordinal, invokes
the complete Parser.ParseInput API and requires zero errors. Only afterward does
it create and invoke the exact payload. No persistent write occurs before that
invocation. Pre-invocation failure prints PREFLIGHT FAILED and exits nonzero.

A uniquely named read-only wrapper variable contains the actual parser outcome,
timestamp, PowerShell version and matched payload SHA-256. A scoped JSON adapter
preserves buffered pipeline objects and the original Depth/Compress arguments.
Only the success-receipt hashtable with exact State and ScriptSha256 receives
PreExecutionParse before its existing transactional receipt write. All other
JSON is delegated to the module-qualified built-in cmdlet. This preserves the
payload hash and makes receipt/serialization failures part of the installer's
existing rollback transaction. It does not create or change human approvals.

Independent static review:
- current_invariant_review: PASS for read-only ancestors, repository-local ACL
  scope, tracked nonfollowing junction cleanup, and false/null authorization.
- receipt_wrapper_review: PASS for receipt integration; the exact State spelling,
  uniquely named read-only evidence and child-scope invocation were retained.
- literal_final_wrapper_review: PASS for the exact command, quoting, parse/hash
  order, scoped buffered serializer, receipt binding and failure handling.

Highest persistent repository ACL/owner object:
D:\projects\NavardKaran\Design-ERP. Separate private installer proof/backup storage:
%ProgramData%\CodexNativeAutonomy. No ancestor of either boundary is modified.
Successful user config.toml changes are content-only; owner/ACL remain unchanged.
Temporary aliases are registered before creation, verified by tag/target/file ID,
and deleted through the same OPEN_REPARSE_POINT handle on success and rollback.
Cleanup failure is ROLLBACK INCOMPLETE; no target tree is traversed/deleted.

Current gate readback remains implementationAuthorized=false and
approvedBaseline=null. No unlock, approval marker, ERP implementation, installer
execution or ACL change has been made by this agent. Actual parser and installation
evidence remain pending the one-time human-controlled runtime action.

## Owner-blocker correction: historical pre-release parse hold (superseded above)

Current executable payload SHA-256 (normalized UTF-8/LF): `abab8c8f3cf42d24128341a278476ffa6826a41b522520feb701b2a643de570b`.

At this earlier review, administrator execution was not approved and an actual
pre-release parse was required. The 2026-10-04 owner instruction supersedes that
hold with mandatory fail-closed human-runtime parsing before payload execution.

Both source defects are corrected and independently statically reviewed:
revised_scope_security_review, revised_junction_security_review and
revised_powershell_static_review returned STATIC PASS. Static review is not
an actual parser run or live administrator verification.

Repository ACL/owner changes are confined to the repository root and objects
within docs, .codex and .cursor, plus existing root governance files. Installer
private scratch/backups use %ProgramData%\CodexNativeAutonomy only. The discovered
user config.toml receives a transactional content update; successful installation
does not change its owner or ACL. No repository ancestor is modified, captured
for mutation, or restored. Its identity/attributes/SDDL are read-only evidence.
Existing ancestor substitution rights must be denied for measured supervisor
and actual native/child tokens before changes and after adversarial tests.
Insufficient ancestor protection fails preflight; no shared-parent repair occurs.

Temporary authority-alias intent is registered before creation. Nonfollowing
Win32 inspection requires a mount-point tag, exact .cursor target and recorded
link file identity. Deletion uses the same handle and FileDispositionInfo.
Cleanup verifies unchanged target identity and absent link; a bounded scan
never descends into reparse points and rejects any remaining artifact. Rollback
attempts cleanup despite test-stop failure, before authority restoration, and
again afterward. Any unresolved cleanup failure reports ROLLBACK INCOMPLETE.
Preflight self-tests cover wrong target, wrong identity and verified unlink.

On 2026-10-03 the nonexecuting Parser.ParseInput validation attempt was rejected
by the installed PreToolUse hook: "Protected evaluator denied the action."
No alternate tool/shell was used to bypass that denial. Actual parser validation
remains unverified before administrator execution. The latest wrapper parses
before execution and records this live result in the installation receipt.
No installer, ACL changes, unlock, approval evidence or ERP implementation was
executed or created during this correction.

## Historical initial administrator action: release evidence (superseded)

Executable payload SHA-256 (normalized UTF-8/LF): `1b52113e3030abbf9152d6b82e5067c6181e2785a39c7f412cfd16498fdc7211`.

The current owner-requested administrator action is prepared in
[install-native-autonomy-transition.md](install-native-autonomy-transition.md).
It contains exactly one canonical executable payload. Its review mirror below
is the same source, not a second transition action. The one human command checks
the normalized UTF-8/LF payload SHA-256 and the entire PowerShell parse before
executing. Direct .ps1 creation was denied by the installed bootstrap hook; no
denial was bypassed and no protected control was changed by this agent.

Independent repair loops covered Governance/Tier-0 isolation, PowerShell/Win32
correctness, ACLs, rollback, native runtime evidence and red-team proof integrity.
The final static results were:

- native_action_release_ps: STATIC PASS for grammar, interop, suspended launch,
  constrained handle inheritance, transaction flow and restoration.
- native_action_release_acl: STATIC PASS for independent Tier-0 isolation,
  all-principal namespace protection, Tier-1 autonomy and protected evidence.
- native_action_release_final required role-specific probe filenames; those
  filenames and all rollback registrations were corrected.
- one_action_last_review: STATIC PASS FOR ONE-TIME ADMIN ACTION after that repair
  and the final schema, repository-trust and universal-denial checks.
- literal_command_review: PASS for the exact one-command wrapper's Windows
  PowerShell quoting, single-payload extraction, normalization, checksum and
  complete parse before execution; no live execution claim.

Earlier findings were repaired: same-user denied scratch creation, ancestor
replacement, unlisted-principal grants, private backup inheritance, ambiguous
TOML keys, nonsemantic schema matching, unrepaired native modes, mutable proof
processes/threads, untrusted descendant claims, unsupported inherited handles,
cleanup after success and colliding concurrent artifacts.

The script's administrator collector authenticates real pipe peers and kernel
ancestry, duplicates actual native tokens and independently measures critical
identity/access results. Local executable hashes are pinned. No agent prose can
satisfy mandatory native audit, child provenance, research or security checks.
Live unknowns are encoded as fail-closed preflight/test assertions. Any failed
mandatory post-change assertion triggers restoration and verification before
ROLLED BACK. Success follows mandatory cleanup, not merely configuration writes.

Not executed: administrator transition, installed-state tests, approval baseline,
checkpoint marker, final implementation unlock or ERP implementation. Current
gate readback remains implementationAuthorized=false and approvedBaseline=null.
No claim of full ERP pre-implementation readiness or human implementation approval
is made. On installed success, the generated receipt instructs the fresh session
to resume AGENTS.md without further Tier-1 path/tool permissions.

Tracked git diff --check and complete source-mirror equality verification pass.
The master objective and remaining architecture/readiness work remain active.

## Administrator transition script source for independent review

Mirrored from install-native-autonomy-transition.md. Review PowerShell, ACLs,
rollback and actual native proof semantics; no installation is claimed.

[Historical code/configuration excerpt removed after retirement; no execution action remains.]

## Current native operating decision and actual evidence (2026-10-03)

The Owner selected native Windows Codex workspace-write, supported Auto-review
and native audit. .codex is Tier 1. Exact read/command/tool routing and the
broker/bootstrap pack below are retired designs, including their installer,
hash map, broker command and Codex-control protection. Preserve review history;
those proposals are not current requirements.

The supplied session reports workspace-write and approvals_reviewer=auto_review.
Fresh probes for CLI version, doctor, .codex configuration, openai-docs skill
and official web research are denied by the old hook. An actual comment-only
Tier-1 hook repair is denied as protected control path. Transaction/idempotency,
posting-kernel and module-owner source reads are denied.

Independent Security and Tooling/Red Team reviewers confirm workspace-write
permits product writes inside the repository. Mutable .codex registration cannot
independently enforce Tier 0. Arbitrary scripts have indirect effects unavailable
to a command-text hook. Supported independent native protection/mandatory host
enforcement is required; installed capabilities cannot currently be inspected.
No configuration syntax, sandbox principal or mandatory-hook support is assumed.

Governance/Repository consistency review found stale active broker links;
README, CURRENT_PHASE, authority, decision, readiness and tool-safety summaries
are reconciled to the native decision. Business evidence/OQ status and historical
APR/CHK approvals are preserved. No protected edit was applied.
See [consolidated native runtime prerequisite](NATIVE_AUTONOMY_TRANSITION.md).
No complete literal native patch, native PASS or final readiness is claimed.

## Current proposed idempotency source for independent review

### Independent review evidence and repairs

- native_governance: Governance and Repository consistency reviewed accessible
  active summaries; identified obsolete broker links/classification, now repaired.
- native_security: Security reviewed actual guards/gate and native design;
  identified mutable-registration and indirect-shell enforcement gaps, plus
  legacy production test overrides and weak editable-APR provenance.
- native_tooling: Tooling/Red Team independently confirmed blocked diagnostics
  and the missing supported independent native effect boundary.
- native_architecture: Architecture reviewed the ADR draft; required named
  constraint recovery, snapshot visibility, coordinator lifecycle ownership
  and distinct-key domain concurrency. These are incorporated in the draft.
- native_idempotency: Idempotency reviewed the draft; required occupied-key
  conflict audit without replacement, stored-version precedence, precise
  savepoints, current access/create-result checks, sensitive-binding protection,
  namespace semantics and restore quarantine. Draft now incorporates them.
- native_final_readiness: independent final reviewer returned NOT READY;
  justified the consolidated external runtime prerequisite and required ADR-0011
  in README's table. That table omission is repaired. No final PASS is claimed.
- native_draft_recheck: independent review of the revised ADR found the prior
  conceptual findings resolved and no new material contradiction. Live-source
  reconciliation, concrete algorithms/limits/access contract and PostgreSQL
  verification remain acceptance prerequisites. This is a draft recheck only.

Final validation: git diff --check passed; fresh text readbacks of the canonical
gate, both active evaluators and Codex hook registration matched the initial
session readbacks exactly. Mirrored revised ADR source matched its prepared
draft. This is text/source evidence, not raw-byte hashes or runtime tests.
Existing protected Git diffs predate this turn; no staging/commit/push occurred.

These are source reviews, not native/runtime/PostgreSQL tests. Full source
reconciliation and concrete technical/physical freeze remain pending.

Mirrored from IDEMPOTENCY_DESIGN_DRAFT.md for reviewers whose source read is
currently denied by the obsolete hook. This is proposed design, not a freeze.

# ADR-0011: generic durable command outcomes and replay

This is a material design draft, not an accepted physical freeze or permission
to implement. The live transaction, audit, API, module and persistence documents
must be read and reconciled before acceptance. Current hook denials prevent that
source reconciliation. Business OQ answers/statuses are unchanged.

The proposed first slice remains SLICE-ENVELOPE: generic admission, identity,
idempotency, outcomes, audit and minimal persistence with nonbusiness fixtures.
It excludes inventory, production, commercial workflows and real factory
permission assignments. ACT-IPS remains the only stock writer; no direct Balance
writes, negative inventory or cross-module persistence writes are introduced.

## Bound request identity

The logical replay namespace is (trusted scope ID, trusted principal ID,
idempotency key). Command identity is bound content, not an extra namespace
component: reusing the same key for another command must conflict. Principal
means the immutable authenticated initiating actor, not a display name, Station,
request-supplied role, worker identity or subsequently assigned delegate.
Scope is an immutable authorization/resource boundary established server-side.
Scope and principal identifiers have validated provider-defined byte identity;
never derive them through case folding, display-name matching or Unicode aliases.
Proposed client keys are 1-128 ASCII octets with case-sensitive comparison and
no whitespace/normalization; verify these limits against the live API before freeze.
The database uniqueness constraint covers exactly scope, principal and key.

Bind command name and contract version, canonical target identity (or explicit
create-target token), supplied expected-version/preconditions, canonicalization
version and payload fingerprint. Include every effect-relevant envelope field;
exclude transport attempt IDs/timestamps which cannot change business effects.
Bind the initiating principal through the namespace, preserving worker provenance
as separate audit evidence. A target cannot be silently substituted by a retry.

Persist the canonical bound request representation and a cryptographic digest.
Use an unambiguous typed/length-delimited representation with no delimiter-based
concatenation. Preserve absent versus null, list order and exact numeric meaning;
canonical map ordering is stable. Do not use JavaScript floating-point parsing
for exact business decimals. Canonicalization is versioned and deterministic;
defaults capable of altering effects are explicit before binding. Compare stored
canonical content as well as digest so a digest collision cannot equate requests.
Credentials, transport tokens and secrets are not effect-bearing command payload
fields; reject them from the admitted schema rather than retain them in binding.
Canonical effect-bearing content can still be sensitive: restrict storage access
and replay disclosure, apply the accepted at-rest protection/key-lifecycle policy,
and reconcile archive/retention requirements. Do not assume audit redaction protects
request storage. Freeze limits and accepted scalar representation before acceptance.

Require callers to resend the original command contract version for replay.
Lookup the admitted namespace/key before applying current effect defaults or
canonicalization. Resolve an existing binding using its stored canonicalizer,
then compare command/target/contract/preconditions and canonical content.
A new engine canonicalization version is not itself a conflict for an old record;
select the stored version. Different requested contracts conflict. No implicit
compatibility adapter can change bound intent. A replay uses the original
contract/canonicalization version. Old versions needed
to interpret durable outcomes must remain supported. An upgrade cannot reinterpret
a prior request as new, weaken binding or execute it again. Unknown legacy format
fails closed with a recovery path; it does not recycle the key.

## Admission, access and cross-principal handling

Authenticate and establish trusted principal/scope before lookup. Enforce current
access to command, scope, target and result before disclosing a cached outcome.
A create-command replay also checks access to the stored resulting resource,
without creating it again; requested and stored identity checks must not leak
foreign results. Resolve authorization at the defined coordinator decision point
for execution and again for replay/result disclosure. Freeze the permission-provider
snapshot/version/revocation concurrency contract; do not treat stale cached access
as current authorization. Revocation therefore prevents replay disclosure at that
decision point. Security/admission denials
(authentication failure, invalid namespace/key, inaccessible resource) do not
become reusable business rejection records under attacker-provided identity.
Record their security audit through its defined separate durable path.

Namespace partitioning permits two principals to use the same textual key
independently. Never search a global key namespace or disclose another principal's
stored outcome. A worker retry carries the original trusted principal/scope and
rechecks current delegation; it cannot assume another principal's key. Any business
duplicate across principals is resolved by the owning module's unique fact guard,
with current-access checks and a minimal nondisclosing result.

## Accepted and rejected replay

Once an admitted request has a terminal accepted or rejected outcome, persist
its immutable binding, outcome identity, guard/status, contract/version and
bounded response representation. Accepted replay returns the original durable
outcome under current disclosure rules. It cannot rerun business validation,
write effects, repost quantity or fabricate a new successful fact.

An admitted deterministic terminal rejection is equally durable. After policy
or business state changes, the same bound key still replays that rejection;
a changed request requires a new key and fresh authorization. Stored rejection
includes stable guard/error contract; sensitive details remain disclosure-bound.
An inaccessible replay is a current security denial and never changes the
original outcome. Nondeterministic/transient failures are not terminal business
rejections and must not poison the key.

New admission with schema/validation errors requires a well-defined safely
canonicalizable bound request. Reject malformed/unbounded input before admission;
do not pretend such rejection has a durable business binding. Exact error classes
and pre-admission security-audit durability must be reconciled with the live API
and audit taxonomy before freezing.

## Key conflicts and duplicate business facts

Same namespace/key plus different command, target, precondition, contract,
canonical representation (using the stored canonicalizer) or payload is
GUARD_CONFLICT. For an occupied key, keep the existing terminal outcome unchanged:
there is no second terminal rejection row for that namespace/key. Record a separate
conflict-attempt/security event under the audit policy. Never overwrite the binding,
execute the new request or reveal the old response merely to explain the conflict.
Malformed input and inaccessible namespace are rejected before a lookup oracle.

A different key that attempts an already existing business fact is distinct from
transport replay. The owning module detects the domain identity under its proper
unique constraint/transaction locks. Use GUARD_IDEMPOTENT_DUP only where its
documented contract means "the same business fact already exists"; it must not
mask differing content, foreign ownership, contradictory state or reused identity.
Incompatible duplicate content is GUARD_CONFLICT. Persist the admitted terminal
duplicate/rejection outcome for the new key without a second business posting.
Do not invent domain uniqueness keys or resolve their OQs in the envelope slice.
Exact guard/result meanings must be propagated to the live guard catalogue.

## Persistence ownership and transaction boundary

The envelope persistence owner writes request binding/outcomes and envelope audit.
Domain owners write only their own business facts using the same application-owned
PostgreSQL transaction context for a named DATA-TX-001 bundle. Passing a transaction
context is not permission for one module to write another module's tables.
No generic middleware directly writes Ledger or Balance. The application coordinator
alone owns the outer transaction lifecycle, key claim, savepoints, terminal outcome,
audit and final commit. Domain modules cannot commit/rollback that outer transaction,
open independent write transactions or retain transaction-bound work after return.

The admitted key claim, accepted outcome, all business effects and the original
command audit commit atomically. Acquire a unique claim on namespace/key inside
that transaction before effects. Competing attempts wait within bounded deadlines,
then inspect committed binding/outcome, or continue only after the first aborts.
Freeze isolation and the exact claim/wait/read algorithm together. A contender
must obtain a fresh snapshot which can see the committed winner, or retry the whole
resolution transaction with the same key/binding; waiting on uniqueness alone is
insufficient visibility proof. Serialization failure uses the same-key retry path.
The envelope claim does not serialize different keys targeting a business fact;
domain owners independently enforce expected-version checks, uniqueness and locks.
There is no separately committed "in progress" lease requiring invented recovery.

A terminal rejected outcome commits with its original rejection audit and no
business effects. For validation before effects, commit that transaction directly.
If a deterministic rejection can arise after tentative effects, roll back those
effects to a savepoint established after the retained envelope key claim and
before any tentative domain effect. Roll back all domain effects to that savepoint,
then persist rejection and audit in the outer transaction. Named verified business
constraint violations may be handled non-abortingly or recovered at that savepoint,
then classified as duplicate/conflict only after safe content/ownership verification.
Unknown constraints, transaction-aborting infrastructure failures, deadlocks,
serialization errors, timeouts and connection/unknown failures roll back the whole
transaction and return a transient/uncertain result. Do not convert infrastructure errors into durable
business rejection. Savepoint exception handling needs PostgreSQL integration proof. The handler
contract forbids effects outside the shared transaction or irreversible external
work before outcome commit.

External irreversible effects are outside SLICE-ENVELOPE. Later external effects
require a separately approved atomic outbox/deduplication contract; they cannot
occur between business writes and the atomic outcome commit.

## Audit replay semantics

The original accepted/rejected command audit exists exactly once per committed
outcome. Replay never creates another original command execution audit. Each
successful disclosed replay records an independent replay-attempt audit referencing
the original outcome, authenticated actor/scope and attempt correlation. Store no
secrets or unbounded raw payload. Security-denied lookups are distinct security
events and cannot expose an outcome foreign key to the caller.

Proposed durable-replay policy: append its audit in a short transaction, commit,
then return the cached result. If replay audit persistence fails or commit is
uncertain, return a retryable/uncertain transport result; do not claim the replay
was durably audited. A retry may append another legitimate replay attempt.
An audit commit followed by response loss can leave an audited attempt with no
client receipt; this does not execute the business command twice. Final audit
taxonomy, retention and sensitive response projection remain reconciliation tasks.

## Crash windows, uncertain retry and recovery

| Failure window | Required behavior |
| --- | --- |
| Before admitted transaction | No claimed terminal outcome or business effects; retry same key/content |
| After uncommitted claim or tentative effects | Rollback/recovery leaves no committed outcome/effects; concurrent retry may then claim |
| During transaction before commit | Entire atomic bundle rolls back; no partial accepted outcome |
| Commit outcome unknown to client | Retry the same namespace/key/content; never assume failure, mint a new key or issue compensation automatically |
| Commit completed, response lost | Retry finds durable accepted/rejected outcome; no second business execution |
| Replay audit committed, response lost | Retry may create a new replay-attempt audit; original outcome/effects remain unchanged |
| Restore/PITR uncertainty | Missing restored record is not proof of nonexecution; quarantine affected scope/time interval and reconcile durable external/client/audit evidence before same-key resolution; no blanket exactly-once claim across data loss |

No "exactly once delivery" promise is made. The invariant is at most one committed
application of the bound command within the authoritative durable transaction
history, with replayable terminal outcomes and explicit uncertain transport results.
A durable rejection is retryable only as a replay; changed intent uses a new key.

Do not garbage-collect bindings and permit old keys to act as new. Proposed
envelope policy retains terminal records indefinitely until a governed retention/
archive/tombstone design preserves binding, nondisclosure and response/recovery
requirements. Capacity/retention bounds and restore coordination require technical
freeze; factory volumes remain live C/D residuals, not fabricated numbers.

## Acceptance and first-slice freeze prerequisites

Verify accepted/rejected replay after restart; target/payload/command/version
mismatch; cross-principal nondisclosure; revoked access; distinct-key fact duplicate
and conflict; concurrent same-key requests; whole-bundle rollback; crash before/
after commit; rejection savepoint rollback; infrastructure/transient distinctions;
response loss; audit failure/uncertainty; canonicalization upgrades; bounds and
retention; recovery quarantine. Use a real PostgreSQL test transaction mechanism
chosen at technical freeze. Nonbusiness fixtures exercise owner interfaces without
implementing factory workflows.

Before final ADR acceptance reconcile live data/API/audit/guard/worker sources,
freeze exact values/schema/index/locking/deadline decisions and persist independent
Architecture, Idempotency and Security review evidence. Keep SLICE-ENVELOPE locked.

## Historical retired broker source and review evidence (2026-10-03)

All old broker source/acceptance/handoff text below is superseded historical
proposal/review evidence, not a current action request, allowlist, human-only
.codex classification or approved installation.

The Project Owner reiterated the autonomous mandate. The attempted Tier-1 hook
edit was denied before execution; no protected file was changed. The concrete
repository candidate is [FINAL AUTONOMY TRANSITION PATCH](FINAL_AUTONOMY_TRANSITION_PATCH.md).
Its external host permission/trust mechanism is unverified; this source is not
an installation or readiness PASS. It supplies data-based governance/security
tests and source syntax checks, not arbitrary mutable-script execution. Native
and live inherited coverage remain pending. This replaces all earlier incremental
read/tool action requests; historical observed evidence below remains historical.

Kernel payload SHA-256: `c00d1af0281d83277a5dcb01370b1ff8a2961806f88c0fc2aada5aab8ca0338f` (UTF-8 LF, no BOM).

The final source reviewer found executor/provenance/8.3-alias, process cleanup
and resource-bound defects. This revision adds executor checks, a protected
native identity map, long-name checks, assigned-process job cleanup and bounds.
Native execution/event mapping and the external host permission/trust operation
remain unverified. The job is assigned after trusted process startup, so the
launch window still depends on external descendant confinement. General governed
stage/commit and arbitrary confined governance test execution are not supplied.
The candidate must not be certified as the complete requested transition.

A second independent recheck found unsupported Cursor shell metadata, unbounded
source parsing, possible Git lazy-fetch effects and external dependency/resource
limits. Source repairs now explicitly fail closed for Cursor shell events, bound
parse inputs, check the deadline after vectors, cap directory results and exclude
global/system config plus local include/promisor/alternate-store Git cases.
External supervisor deadlines, native dependency/loader protection, complete
Tier-1 configuration maintenance and a confined general test/checkpoint executor
remain unresolved. No native compile, live containment or readiness PASS exists.
The full README and live OQ register were reread without truncation. Their business
answers and OQ statuses were not changed by this loop.

[Historical code/configuration excerpt removed after retirement; no execution action remains.]



> Historical discovery evidence. Incremental next-read/identifier requests
> below are superseded by the 2026-10-03 autonomous mandate and the
> [single bootstrap pack](AUTONOMOUS_PRE_IMPLEMENTATION_BOOTSTRAP_PACK.md).
> They are not current action requests. Preserve the observed denials and
> limits; current readiness is NOT READY pending bootstrap validation.

Implementation remains unauthorized. This is review evidence and a protected
edit proposal, not approval, a checkpoint marker, or an implementation unlock.

## Observed evidence

- Read the installed Codex hook and all twelve paths enumerated by its new
  governance-read predicate. Each shell read was a separate invocation.
- `Get-Content -LiteralPath 'README.md'` succeeded.
- `Get-Content -LiteralPath 'README.md'; Get-Content -LiteralPath 'docs/00-governance/CURRENT_PHASE.md'`
  was blocked by PreToolUse: `Protected evaluator denied the action`.
- `collaboration.spawn_agent` was blocked by PreToolUse. The runtime reported
  the exact classified identifier as `collaborationspawn_agent` and the reason
  as `Unclassified tool operation`. No independent agent review ran.
- `get_goal` returned no current goal. The prior master objective is not
  available through that tool; recover its repository record before claiming
  that the full readiness loop has been completed.
- `git diff` succeeded through the existing legacy read-only shell policy.
  No new Git allowance is needed. It shows pending governance changes but no
  tracked prior Codex-hook version against which to verify the owner's exact
  edit delta. Verification here is of installed source and observed behavior.

## Installed-source assessment

The new predicate enumerates twelve literal paths, escapes each for regex
matching, anchors the command, requires Get-Content with -LiteralPath, and
rejects chaining characters, pipelines, redirection, backticks, and CR/LF.
It adds no wildcard path. No writes, deletes, moves, or general PowerShell
execution are admitted by this predicate.

The implementation-authorized branch precedes the new locked-read branch.
It still requires a matching unlock, compares commands with Ordinal exact
equality against allowedShellCommands, and delegates to the protected Cursor
validator. This is source verification; unlocked execution was not tested and
no authorization state was changed.

The read predicate itself does not resolve targets or check reparse points as
the patch target validator does. Literal textual scope is verified; physical
target integrity has not been established by these live probes.

Live allow and deny evidence establishes interception for these shell calls;
the collaboration denial establishes interception for that tool attempt.
It does not establish complete write/tool coverage, project trust history,
or completion of the synthetic regression suite. The installed test helper
has no dedicated vectors for the new governance-read predicate.

## Readiness findings

The canonical gate remains architecture-only, implementationAuthorized false,
and approvedBaseline null. Protected Codex controls remain outside its locked
write allowlist. No gate, hook, unlock, or checkpoint marker was changed.

The live OQ register controls residuals. CURRENT_PHASE and IMPLEMENTATION_READINESS
still contain older summaries of routing-step names and numeric residual
cutoffs. The live register instead records ten Stations, order-specific routing,
factory measurement precision, human reusability judgment without a universal
numeric cutoff, and future-only Quality residuals. These differences require
reconciliation against the existing readiness evidence, not invented decisions
or automatic OQ closure. Several pending governance paragraphs are incomplete.

## Minimum next protected human edit proposal

Only the Project Owner may edit .codex/hooks/architecture-write-gate.ps1.
For the next discovery/review step:

1. Add exactly `collaborationspawn_agent` to the exact tool-name allowlist.
   This permits delegation, not unrestricted shell or file access. Child-agent
   actions must remain subject to the same gate. Live-test that inheritance
   before relying on multi-agent review. Do not add a collaboration namespace
   wildcard or guessed identifiers for other collaboration tools.
2. Add exactly these paths to the existing single-command governance-read
   list, preserving its command grammar:
   - docs/10-ai-cursor-development/CODEX_CONTROL_BOOTSTRAP.md
   - docs/10-ai-cursor-development/TOOL_MCP_HOOK_SAFETY.md
   - docs/10-ai-cursor-development/CODEX_READINESS_READ_REVIEW.md
   The first two recover the accepted bootstrap scope and remaining verification
   procedure. The third permits reading back this proposal after application.
3. Preserve the protected-path policy, implementation branch, and exact unlock
   shell enforcement. No implementation grant or test-runner command is proposed.

Further architecture paths or a regression-runner command must be derived from
those records and separately justified. No unrestricted ReadFile/rg tool,
docs wildcard, PowerShell script execution, or write privilege is needed for
this immediate step.

## Stop condition

DIRECT HUMAN-ONLY ACTION REQUIRED: review and apply the protected allowance
above. The hook denial stops the affected collaboration action. The full
readiness verdict remains pending; the historical Gate 6 result is not a
fresh verification of the current working tree.

## Repository-root live verification update (2026-10-03)

This update supersedes the earlier collaboration denial and immediate protected
edit proposal above. It records current probes, not approval or an unlock.
Every shell invocation used normal non-escalated execution with explicit
workdir `D:\projects\NavardKaran\Design-ERP`. The Project Owner confirmed
launch from that root. Installed evaluator source checks `event.cwd` for Bash
and apply_patch and checks any requested workdir against the same root.
No additional Get-Location prerequisite is required.

| Check | Result | Evidence |
| --- | --- | --- |
| repository-root enforcement | VERIFIED BY HOOK CWD CHECK | Installed source checks event.cwd and requested workdir before shell/patch dispatch; live approved reads passed |
| existing governance read | VERIFIED | Literal README.md read returned exit code 0 |
| new governance read | VERIFIED | Literal CODEX_READINESS_READ_REVIEW.md read returned exit code 0 |
| compound command denial | VERIFIED | README.md and CURRENT_PHASE.md reads separated by semicolon denied by PreToolUse before execution |
| collaboration spawn | VERIFIED | Supported collaboration.spawn_agent invocation, classified as collaborationspawn_agent, created governance_inheritance_probe |
| child-agent governance inheritance | VERIFIED | Child CURRENT_PHASE.md read returned exit code 0; child compound read denied by the same PreToolUse guard |
| unknown-tool default deny | VERIFIED | Harmless clock current-time call classified as clockcurr_time denied as Unclassified tool operation |
| protected self-modification denial | VERIFIED | Synthetic empty-hunk apply_patch targeting .codex/hooks/architecture-write-gate.ps1 denied as Protected control path is blocked |

The protected patch contained no added or removed content. No protected file,
unlock, checkpoint marker, or ERP artifact was changed by these probes.
These results establish interception for the tested operations. They do not
establish every tool's coverage, complete regression coverage, or final
implementation readiness. Root mismatch denial was assessed from installed
source rather than running a probe outside the authorized repository root.

### Readiness continuation and actual boundary

Read CURRENT_PHASE.md, DECISIONS.md, OPEN_QUESTIONS.md, AGENT_AUTHORITY.md,
APPROVALS.md, IMPLEMENTATION_READINESS.md, CODEX_CONTROL_BOOTSTRAP.md,
TOOL_MCP_HOOK_SAFETY.md, the installed Codex evaluator, and the canonical gate.
The gate remains architecture-only with implementationAuthorized false and
approvedBaseline null. Its protected paths include .codex/hooks.json and
.codex/hooks/**; docs Markdown is within the locked write scope.

Independent governance and security/tooling reviews were delegated. Full
architecture and idempotency reviews cannot yet be completed: the normal
literal read of docs/04-database-architecture/TRANSACTION_AND_IDEMPOTENCY.md
was denied by PreToolUse with Protected evaluator denied the action. That
affected read and review are stopped; no alternate tool or Git content read
was used to bypass it.

The installed predicate permits fifteen exact governance/control reads. It
does not include the architecture/layout/security sources needed for the
requested full loop. The prior master objective is not yet recovered from a
repository record. The current user request supplies the continuation scope,
but is not evidence that a historical master record or its review is complete.

CURRENT_PHASE and IMPLEMENTATION_READINESS still refer to routing-step names
and residual cutoff numbers. The live OQ register records ten Stations,
order-specific routing, no universal numeric cutoff, human reusability
judgment, and future-only Quality residuals. Reconciliation must preserve
the remaining technical scale, routing lifecycle, posting, identity, and
authorization gaps; it must not close OQs or accept packages automatically.

### One next human-only action: exact read allowance

The Project Owner must review and apply one protected edit to
.codex/hooks/architecture-write-gate.ps1: append exactly the following paths
to Test-LockedReadOnlyGovernanceCommand's allowedPaths list. Preserve its
single-command grammar, repository-root checks, protected-path rules, and
implementation lock. This proposal grants reads only, not test-runner
execution, shell wildcards, writes, an ADR approval, or an implementation
unlock. The existing collaboration allowance needs no further change.

Governance/objective recovery and reconciliation sources:

[Historical code/configuration excerpt removed after retirement; no execution action remains.]

Architecture, generic idempotency, future layout, and security review sources:

[Historical code/configuration excerpt removed after retirement; no execution action remains.]

### Independent review findings

governance_readiness_review independently confirmed stale routing, QC,
residual-cutoff, and roster summaries and the malformed DECISIONS introductory
sentence. Its live OQ output was truncated, so neither its review nor this
update claims a complete row-by-row register reconciliation. Measurement
precision must remain distinct from technical arithmetic/persistence scale.
It did not recover the historical master objective. An erroneous phase-10
IMPLEMENTATION_READINESS.md read was denied and not bypassed; the actual
phase-12 file was already read successfully by the parent.

security_tooling_review independently read both hook sources and confirmed
the root checks, literal governance read predicate, protected-path denial,
and unknown-tool default deny. Both review children encountered denied
collaborationsend_message calls and returned reports through the supported
automatic final-result mechanism. This adds child tool-classification
evidence; no broader collaboration allowance is proposed.

The security review identified a robustness issue: redirected subprocess
output is read synchronously before WaitForExit(20000), so that timeout does
not reliably bound a hung evaluator. This is a protected-control review
finding, not an observed authorization bypass, and does not authorize an
agent fix. Record and assess its blocking scope during tooling reconciliation.
Full architecture/idempotency reviews and the final integrated red-team
verdict remain pending the required source reads.

DIRECT HUMAN-ONLY ACTION REQUIRED: apply the reviewed exact read allowance.
No checkpoint is claimed or attempted without a valid human-created marker.
PRE-IMPLEMENTATION READINESS remains pending; SLICE-ENVELOPE is not started.

## Autonomous mandate continuation (2026-10-03)

The new Project Owner mandate supersedes the incremental human read/tool
requests above. The [single consolidated bootstrap pack](AUTONOMOUS_PRE_IMPLEMENTATION_BOOTSTRAP_PACK.md)
and [persistent objective](AUTONOMOUS_PRE_IMPLEMENTATION_OBJECTIVE.md) record
the current operating model. No obsolete individual allowance request remains
active. Canonical authorization is still false/null; no ERP code was created.

Governance, Security/Red-Team and Tooling agents inspected current controls.
A fresh final reviewer rejected bootstrap installation/readiness without proof
of supported external confinement and native/payload/live testing. Mutable
operational scripts cannot enforce an immutable boundary by convention alone.
The proposed mandatory registration/verifier remains human-protected; mutable
operational controls belong in a confined non-product tree. Production test-mode
environment authorization overrides must be removed in the protected transition.

The current hook continues to block unlisted architecture reads, goal creation,
full collaboration messaging, supported diagnostics, the openai-docs skill read
and authoritative web research. The allowed legacy regression invocation failed
because script execution is disabled; selecting another supported shell did not
resolve it. No source-reading, encoded execution or alternate-tool bypass was used.
No successful native regression or complete hook/security PASS is claimed.

Active CURRENT_PHASE, DECISIONS, APPROVALS, AGENT_AUTHORITY, hook-safety,
readiness and README summaries now record delegated routine authority and
NOT READY. Historical APR/CHK facts remain distinct. Preliminary A-F residual
classification is planning evidence, not OQ closure; the full register/architecture
review remains pending. Generic idempotency, crash semantics, first-slice freeze
and current version verification remain A blockers.

A fresh targeted documentation review found two README defects: incomplete
current control scope and obsolete numeric-cutoff language. Both were repaired
and independently verified. Authority tables distinguish AG-GCP from AG-CHK,
technical decisions from human approvals and proposed scope from unlock activation.
No new material contradiction was found in that targeted repair review.

Final checks: tracked git diff --check passes; all four installed protected
sources match their pre-work normalized SHA-256; four in-memory replacement
payloads match installer hash pins. These are not raw-disk validation of new
artifacts, native payload tests or runtime confinement evidence. Protected
working-tree changes present at entry were preserved; no commit/staging/push,
human marker or implementation unlock was performed by Codex.

Current verdict: NOT READY. One bootstrap proposal exists, installation HOLD.
The supported external permission/trust mechanism cannot yet be verified through
the permitted tool surface. This remains the protected runtime boundary; do not
activate broad mutable script commands under the current repository-wide writable
profile or claim the proposed permission contract is an installed configuration.

## Fresh autonomous continuation review (2026-10-03)

The repeated owner mandate is the same persistent objective: bring the ERP/MES
repository to independently reviewed, technically frozen PRE-IMPLEMENTATION
readiness without starting ERP implementation. Continue DISCOVER, parallel
review, reconcile, modify, test, independent review and red team after the
single protected transition is safely available. No new implementation approval
is inferred. Existing protected working-tree changes were present at entry and
were preserved; this loop did not write a gate, unlock, marker or operational hook.

Fresh reviewers: governance_audit (Governance/Repository Consistency),
security_audit (Security/Red Team), tooling_audit (Tooling),
architecture_review (Architecture), idempotency_review (Idempotency).
Reports arrived through automatic final delivery; collaboration messaging
remains denied. The architecture and idempotency reviewers could not read
their required sources and did not issue an architecture PASS. A fresh final
review must assess the new classification and this evidence before stopping.

| Operation | Actual result in this loop |
| --- | --- |
| Goal creation | Denied as unclassified create_goal; objective persists in repository records instead |
| Exact literal governance/control reads | Succeeded for the installed permitted paths |
| Read with explicit UTF8 encoding | Denied; ordinary literal reads used, with terminal mojibake documented |
| Existing autonomous bootstrap-pack read | Denied; no alternative retrieval or completeness claim |
| OpenAI documentation skill read | Denied; skill was not applied and no supported runtime configuration was invented |
| Official web research | Denied as unclassified webrun; runtime/package support evidence remains pending |
| Collaboration spawn | Succeeded for the independent reviewers |
| Child collaboration messaging | Denied as unclassified collaborationsend_message |
| Architecture/idempotency source reads | Denied; affected review remains incomplete |
| node --version (Tooling reviewer) | Denied; installed version/health not inferred |
| Legacy native governance suite | Allowed invocation failed with PSSecurityException because script execution is disabled; no tests passed in this invocation |
| git status --short / git ls-files / git diff --check | Succeeded; tracked whitespace check passed |
| Ordinary governance Markdown patches | Succeeded; no implementation artifact was created |

The legacy command was exactly `& ".cursor/hooks/test-architecture-write-gate.ps1"`.
No execution-policy override, alternate-shell bypass or production test-mode
authorization override was activated. A future permitted native invocation must
address execution policy explicitly as part of the protected transition.

Safe independent work completed: classify all nineteen OQ rows and the recorded
additional factory residual sections in the live register; preserve all answers
and statuses; link classification from readiness; clarify the historical
pre-bootstrap evidence heading. Propagation into denied architecture sources
remains pending. This is delegated draft governance, not human APR/CHK approval.

### Consolidated bootstrap acceptance requirements

These are acceptance requirements for the existing single
[AUTONOMOUS PRE-IMPLEMENTATION BOOTSTRAP PACK](AUTONOMOUS_PRE_IMPLEMENTATION_BOOTSTRAP_PACK.md),
not a second pack, an installation command, or certification of its unread bytes.
The current pack remains HOLD. Do not apply an old candidate merely because a
new conversation repeats the autonomy mandate. A complete installable package
requires verified supported runtime configuration, exact payload bytes and hashes,
native validation, trust/provenance and rollback; these are not available through
the current permitted surface. No human read-path/tool micro-edit is requested.

The one protected transition must cover all of the following together:

1. Human-protected mandatory registration and a small fixed authorization
   verifier, independent of agent-maintained operational code. Preserve the one
   canonical gate, false/null state, human-only unlock/marker and final baseline
   authority. Mutable Tier 1 must never redefine, disable or substitute Tier 0.
2. A supported external execution permission profile protecting Tier 0 and its
   ancestors, and denying product writes by every tool and descendant process.
   The observed session gives repository-wide write rights while separately
   listing `.codex`, `.git`, `.agents` and `.aws` as read paths. That declaration
   is not proof that the proposed replacement confinement is installed or that
   all alias/ancestor/process attacks are prevented. Do not run mutable tooling
   on the host on the strength of a Markdown contract.
3. Whole-repository reads/search/discovery; supported official documentation,
   skill and web research; goal/planning/status operations; all supported
   collaboration lifecycle operations and inherited Tier-0 lock. Classify actual
   normalized tool identifiers, including spawn, messaging, follow-up, interrupt,
   list and wait. Approval of a tool name must not grant its mutating forms.
4. Agent-managed non-product operational policy/tooling and ordinary
   architecture/governance/planning writes within exact effective write roots.
   Tier-1 fixtures may simulate approvals but cannot create a valid live human
   approval or run outside confinement. Freeze protected host registration;
   host hooks must not load mutable operational code with host write rights.
5. Safe native diagnostics, version discovery, static/security/governance
   tests and temporary review tooling within confinement. Resolve shell/profile,
   executable provenance, execution policy, dependency/lifecycle scripts and
   environment semantics. Diagnostic script arguments must not become an
   unrestricted host interpreter. No ERP package/source/migration/UI/API grant.
6. Remove every production ARCHITECTURE_GATE_TEST_* authorization override.
   Use explicit fixture inputs to an isolated test evaluator. Bound subprocess
   execution from start; asynchronously drain stdout/stderr; enforce deadline
   and descendant termination. Current ReadToEnd-before-WaitForExit code does
   not provide that deadline.
7. Bind human implementation approval to the actual approved commit and exact
   artifact/manifest bytes through human-protected evidence. An editable Markdown
   approval sentence and a commit-shaped string cannot establish provenance.
   No delegated GCP or changed APR text can serve as the final human baseline.
8. Canonical physical-path checks for reads of authorization state and every
   mutation/launch; deny traversal, ADS/device names, reparse ancestors, hard-link
   aliases, ancestor replacement and TOCTOU escapes. Filesystem/process
   confinement must enforce effects, beyond lexical command/patch checks.
9. Delegated ordinary GCP preparation and local checkpoints via a trusted
   bounded mechanism; exact artifact hashes/blob IDs and parent/result commits;
   existing protected human diffs excluded unless covered by a human receipt.
   No push/history rewrite; human APR/CHK baseline procedure remains distinct.
10. Frozen trusted registration/verifier/payload manifest with raw-byte hashes,
    preflight mismatch refusal, human application/trust receipt, controlled
    restart, failure-closed rollback and post-transition native/live independent
    tests. Failed verification leaves implementation locked and installation HOLD.

Native/live tests must prove both allows (repository reads, architecture reviews,
governance edits, collaboration lifecycle, diagnostics, research, Tier-1 policy
maintenance/tests and delegated checkpoints) and denies (gate true-bit or baseline
mutation, unlock/marker creation/spoofing, business implementation, root verifier
replacement, mutable subprocess/alternate tool escape, encoded patch traversal,
reparse/hard-link/ancestor escape, shell injection, package/Git-hook/executable
indirection and inherited subagent escape). Exercise hangs and invalid output,
not only cooperative evaluator responses. Test inability to manufacture human
approval despite writable architecture documentation. No successful native
regression, runtime confinement or red-team PASS is claimed by this source review.

### Generic idempotency candidate for material ADR reconciliation

This is proposed review content from the independent Idempotency role. Required
source reads were denied, so it neither supersedes the accepted transaction
architecture nor resolves Class A. Route a material ADR after source reconciliation;
any required human acceptance belongs in the final consolidated package.

- A unique caller-key namespace plus versioned binding covers command/version,
  target/resource, trusted immutable principal and stable authorization/resource
  scope, material payload fingerprint and concurrency preconditions. Decide the
  namespace explicitly; lookup/isolation must not leak another principal's key
  or outcome. Principal/scope are obtained from trusted execution context.
- Freeze canonicalization/schema version, default/omitted/null differences,
  decimal string representation, meaningful array ordering and all material
  inputs. Exclude incidental trace IDs. Define digest and size bounds. Ordinary
  unspecified JSON serialization is insufficient.
- Authenticate and authorize current access before returning any stored outcome.
  Historical matching identity alone cannot override revocation or expose another
  scope. Stable scope identity is distinct from volatile role membership.
- A fully matching key replays the original committed accepted or durable rejected
  outcome without business execution. Different command, payload, target,
  principal or scope preserves the original binding and yields conflict/access
  rejection without disclosure. In-flight attempts wait or get a defined retryable
  result; they cannot execute concurrently.
- Reconcile GUARD_CONFLICT for incompatible bindings and GUARD_IDEMPOTENT_DUP
  against all existing uses. Exact accepted replay should retain its accepted
  outcome. Do not silently use one duplicate label for both replay and a
  distinct-key duplicate business fact.
- Different caller keys still need the owning domain's fact identity/constraints
  and locks. The generic envelope cannot invent those factory natural keys. Later
  module slices supply their constraints; ACT-IPS remains the only stock writer.
- Durably cache terminal business/validation rejections only after a valid
  authenticated binding exists. Identical retries replay the rejection even if
  business state changes; a new legitimate attempt needs a new key. Unauthenticated,
  unauthorized, unbindable malformed requests and key-binding conflicts cannot
  poison another record. Transport/dependency/serialization failures or an
  uncertain commit are retryable infrastructure outcomes, not permanent rejections.
- Business effects, durable accepted outcome and required execution audit commit
  in one PostgreSQL transaction under existing module owners. Terminal rejection
  commits outcome/audit with zero business effects; roll back tentative writes
  before persisting it. Explicit savepoint policy, if used, cannot turn a failed
  transaction into a cached terminal rejection. Avoid independently committed
  in-progress leases without a separately proved recovery algorithm.
- Before commit, crash/rollback leaves no business effects or terminal outcome.
  After commit but before response, same-key retry resolves the committed outcome.
  Uncertain commit is resolved against canonical persistence using the same key;
  do not automatically replace it or issue a fallback post. Matching concurrent
  requests execute once; mismatches preserve the winner; distinct-key requests
  remain subject to domain fact constraints. Outage leaves uncertainty retryable.
- Original execution audit is unique. Replay-attempt evidence, if required, links
  to it and does not duplicate success audit or facts. Decide replay audit
  durability/failure policy and redaction; cached results must not contain secrets
  or grant historic permissions. Freeze bounded result content and retention.
  Key deletion/reuse requires tombstone/fact protection against delayed retries;
  backup/restore preserves outcome/audit/fact consistency.
- SLICE-ENVELOPE remains a candidate minimal generic envelope/binding/fingerprint/
  rejection/outcome/audit/transaction contract with non-business fixtures. No
  Inventory, Production, MES, Sales, Procurement, Shipment, Finance-Lite, Portal,
  Weighbridge or authentication-product behavior is included.

Required later verification: canonicalization vectors; accepted/rejected replay;
every binding mismatch; revocation/principal/scope leakage; real PostgreSQL
concurrency; different-key fact duplicates; guard/savepoint failures; audit
failure; serialization/deadlock rollback; crash before commit and response loss
after commit; uncertain resolution; retention/restore. No product code or business
migration is created to prove these during this locked phase.

### Independent review repair loop and bounded handoff

final_independent_review did not author these changes. It accepted the limited
draft-governance provenance and preserved OQ statuses, but required explicit
payment-method residuals and CURRENT_PHASE mapping/operator wording. Those
corrections were applied. red_team_recheck reported denied reads and did not
provide a PASS; its exact command syntax was not returned. Follow-up coordination
was itself denied as collaborationfollowup_task. A separate red_team_exact_read
reviewer used the already permitted single-file literal command form and read
all three assigned files successfully. That successful review is not a workaround
for a denied path; it used the same exact read syntax used by the parent.

The exact-read red team required explicit A prerequisites for the generic
trusted-principal/scope/current-access/test-context contract and key/payload/result
bounds, concurrency/deadlines and replay lifecycle. The OQ classification and
readiness now distinguish these from B domain permissions and C/D actual factory
counts. Idempotency namespace, mismatch rejection precedence/nondisclosure,
rejection admission/persistence families, canonicalization/digest/size limits,
in-flight response, replay-audit durability and retention/tombstones remain
undecided in the candidate. No wording here resolves those A blockers.

The fresh final_repair_verification reviewer returned PASS FOR LIMITED DOC
REPAIR ONLY, confirmed all targeted repairs and identified no further correction
in them. Its full OQ output was truncated, so it did not certify the whole
register/architecture. Full readiness remains NOT READY and installation HOLD.
Architecture, runtime/package research, physical layout,
exact implementation grants, raw payload/hash validation, native suites and
actual confinement/security validation remain blocked or pending. No final
implementation authorization package can state blockers NONE from this evidence.

This loop's bounded changed-artifact list, distinct from pre-existing dirty work:

- docs/00-governance/registers/OPEN_QUESTIONS.md: delegated residual scopes;
  full reread comparison confirmed the prior body beginning at Status values
  was unchanged (recorded answers, statuses and factory evidence).
- docs/00-governance/CURRENT_PHASE.md: actual missing mappings/operators and
  routing/lifecycle/future-Quality wording.
- docs/10-ai-cursor-development/CODEX_CONTROL_BOOTSTRAP.md: historical heading.
- docs/10-ai-cursor-development/CODEX_READINESS_READ_REVIEW.md: fresh evidence,
  single-pack acceptance requirements and unapproved idempotency candidate.
- docs/10-ai-cursor-development/TOOL_MCP_HOOK_SAFETY.md: tested versus complete
  interception distinction and fresh evidence link.
- docs/12-implementation-planning/IMPLEMENTATION_READINESS.md: live classification
  link, omitted answered-row residuals and explicit generic technical A blockers.

Tracked git diff --check passed. The permitted literal readback of this untracked
review file had no trailing-whitespace lines. These checks are not native
governance-suite execution or raw-byte artifact hashing. No staging, commit,
push, protected transition, marker, unlock or ERP implementation was performed.
Pre-existing protected gate/validator changes remain outside this loop's authorship.

One unavoidable protected runtime/control transition remains, governed by the
existing single bootstrap pack and consolidated acceptance requirements above.
The pack's read is denied in this session, and official supported configuration
research is denied; its completeness and installability cannot be certified.
Do not substitute an unsupported invented configuration or ask for incremental
read/tool allowances. Keep installation HOLD until the human-protected supported
confinement/registration transition can be prepared and verified as one complete
action. The autonomous master objective is unfinished and persists for continuation.
# RETIRED — native-autonomy experiment abandoned (2026-10-04)

The Project Owner terminated this experiment. Its adversarial OS-containment
objective exceeded the ERP development workflow's needs. This file is an
in-place historical archive, not an installer or an approval request.

Do not run any command or payload from this file. The historical transition
request is withdrawn. All former READY instructions, commands and digests
below are historical and withdrawn. Historical evidence is retained for provenance only. No installer, ACL change, task or host control
is installed, repaired or authorized by this retirement.

Codex is a trusted engineering agent. implementationAuthorized=false;
approvedBaseline=null; final unlock absent. Complete ERP pre-implementation
design and useful independent reviews, then stop for explicit human implementation
authorization. Native containment is not an implementation-start prerequisite.

---

## Current review repair record (2026-10-04)

Independent architecture/tooling and domain reviews observed the old readiness
v0.12.0 native blockers. Version 0.13.0 removes them and records ADR-0012 and
real ERP prerequisites. Measured 1 kg is resolution, not a universal minimum.
The literal DB reviewer assessed author-supplied proposal text, not inaccessible
canonical files. Its restore-loss finding is repaired: post-restore writes remain
fenced pending history preservation or reviewed uncertain-request reconciliation.
40P01/40001/timeouts precede business constraint mapping. No full source-consistency
or final readiness PASS is claimed. Product tests remain planned, not executed.

---

