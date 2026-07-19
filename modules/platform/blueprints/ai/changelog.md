# ai — changelog

## [Unreleased] — expansion (reconciliation with .ref/AI)

Reconciled the blueprint against the reference implementation at `.ref/AI/` —
the source of truth from `.kiro/specs/ai-assistant/design.md` §2-3.

### Personas (was 9, now 11)

- Added `AthleteAssistantPersona` (v1.5 deferred — `#[NeverAutoWrite]`).
- Added `StaffAssistantPersona` (`branch_manager` role, not `staff` — no such
  role in Tenancy::defaultRoles()).
- Added `ReceptionAssistantPersona` (`front_desk` role).
- Removed `HeadCoachAssistantPersona` — no `head_coach` role in the canonical
  catalogue. Cross-team scouting concerns fold into CoachAssistantPersona +
  AdminAssistantPersona.

### Role catalogue fix

Persona role bindings now reference the canonical `Tenancy::defaultRoles()`
catalogue exclusively:

- **Base**:
  `owner, admin, branch_manager, coach, athlete, parent_guardian, front_desk, viewer`
- **Sports variants**: + `medical`
- **NO** `head_coach` / `hr` / `finance` / `staff` (they don't exist).

Permission seeder now uses these roles only.

### Enums (4 owned)

- `Sensitivity` — 5-tier ordered enum
  (Public/Pii/Financial/Medical/Safeguarding) with `->rank()` + `->covers()` +
  `->isHardDeny()`. Safeguarding is hard-denied by SensitiveDataGate.
- `WriteMode` — Read/Draft/Write. `->bypassesDraftFlow()` decides tool routing.
- `RunStatus` — Running → Succeeded/Failed/Cancelled/RateLimited. Fixed schema
  enum values (was `completed/blocked`; now `succeeded/rate_limited`).
- `DraftStatus` — Open → Confirmed/Expired/Discarded. `->canConfirm()` +
  `->canDiscard()`.

### PHP attributes (5 owned)

- `#[AsAiTool(name, description?)]` — tool discovery.
- `#[Sensitivity(level)]` — per-persona ceiling.
- `#[RequiresRoles(roles[])]` — persona role binding.
- `#[NeverAutoWrite]` — persona defence-in-depth marker.
- `#[AllowBackgroundWrite]` — tool-level escape hatch.

### AiDraft entity (new)

Added `adr_` prefix + `ai_drafts` table. Draft-then-confirm envelope for
`WriteMode::Draft` tool writes. Every `WritableTool.handle()` locks writes into
this row; `POST /ai/drafts/{id}/confirm` applies. action_payload IMMUTABLE
post-create.

### Conversation ownership clarified

`AiConversation` (`aic_`) is a tenant-scoped METADATA WRAPPER over the vendor
`agent_conversations` table (owned by `laravel/ai` via `Conversational` +
`RememberConversation`). Message history lives on the vendor table; this row
owns the tenant/audit envelope. Registry description updated.

### Agent middleware pipeline (7)

Documented the vendor `AgentMiddleware` classes returned from each persona's
`middleware()`:

- BindTenantContext / InjectTenantSystemPrompt / SensitiveDataGate /
  PiiAnonymizerPipe / RecordAiRun / EmitRunSummary / CheckCancellation

### HTTP middleware pipeline (4)

- `ai.feature` — feature-flag gate
- `ai.rate` — per-user/per-tenant rate limit
- `ai.reserve` — token pool reservation
- `ai.persona-role` — `#[RequiresRoles]` enforcement

### MCP support (Enterprise)

- `Mcp/ToolServer` + `Mcp/AiToolAdapter` — exposes tenant AI as an MCP endpoint
  for external agents (Claude Desktop, Cursor, Zed).
- `ai:mcp:serve` command starts the server.
- Enterprise-only per `ai.mcp` entitlement.

## [Unreleased] — inception (Wave 4)

- Initial blueprint authored from DOMAIN_MODULES_BLUEPRINT.md §10.21.
- Four owned entities: AiConversation / AiRun / AiToolCall / AiEmbedding.
- Backend-first (D6 locked) — browser never holds provider keys.
- Wraps `laravel/ai` (first-party). Provider-agnostic via AiProvider contract.
- 9 built-in personas (reconciled to 11 in expansion pass).
- Attribute-driven tool discovery via `#[AsAiTool]` + persona registration.
- Full audit: every prompt + response + tool call stored with SHA-256 hashes.
- Per-tenant AI-token pool via entitlements.

### Dependencies

- `foundation`, `tenancy`, `application`, `user`, `rbac`, `entitlements`,
  `storage`, `search`, `audit`, `activity`, `compliance`, `notifications`.

### ULID prefixes

- `arv_` (AiRun), `atc_` (AiToolCall), `aie_` (AiEmbedding), `aic_`
  (AiConversation metadata wrapper), `adr_` (AiDraft — new in expansion) —
  registered in `modules/shared/blueprints/foundation/data/ulid-prefixes.json`.
