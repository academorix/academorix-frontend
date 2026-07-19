# ai

Tenant-scoped AI personas + tools + draft-then-confirm flow, built on top of the
first-party `laravel/ai` SDK. Wave 4. Backend-first per D6 locked — the browser
NEVER holds provider keys.

**Reference implementation:** `.ref/AI/` — full Laravel package with 11
personas, 4 enums, 5 PHP attributes, 7 agent middleware, and MCP server. This
blueprint mirrors that structure.

## What this module owns

- `AiRun` (`arv_`) — single model invocation (model / provider / tokens / cost /
  latency / status per RunStatus).
- `AiToolCall` (`atc_`) — individual tool invocation inside a run.
- `AiDraft` (`adr_`) — draft-then-confirm envelope for `WriteMode::Draft` tool
  writes.
- `AiEmbedding` (`aie_`) — pgvector embedding for RAG search.
- `AiConversation` (`aic_`) — tenant-scoped metadata wrapper over vendor
  `agent_conversations` (adds tenant_id + persona + cost totals for admin
  visibility). Message history lives on the vendor's own table.

## Three-layer architecture

1. **AI module** — owns tools, agents, provider calls, tenant scoping, audit.
2. **Domain modules** — contribute tools via `#[AsAiTool]`.
3. **Personas** — bundle tool set + system prompt + guardrails via composed
   vendor Agent contract.

## Eleven built-in personas

| Persona                           | Roles             | Sensitivity | `#[NeverAutoWrite]`?                      |
| --------------------------------- | ----------------- | ----------- | ----------------------------------------- |
| `CoachAssistantPersona`           | `coach`           | `Pii`       | no                                        |
| `ParentAssistantPersona`          | `parent_guardian` | `Pii`       | no                                        |
| `AthleteAssistantPersona`         | `athlete`         | `Pii`       | **yes** (v1.5 deferred)                   |
| `AdminAssistantPersona`           | `admin`, `owner`  | `Financial` | no                                        |
| `FinanceAssistantPersona`         | `admin`, `owner`  | `Financial` | no                                        |
| `MedicalAssistantPersona`         | `medical`         | `Medical`   | **yes**                                   |
| `StaffAssistantPersona`           | `branch_manager`  | `Pii`       | no                                        |
| `ReceptionAssistantPersona`       | `front_desk`      | `Pii`       | no                                        |
| `AnomalyDetectorPersona` (bg)     | system            | `Pii`       | **yes**                                   |
| `NotificationDrafterPersona` (bg) | system            | `Pii`       | no                                        |
| `SearchIndexerPersona` (bg)       | system            | `Pii`       | no (uses `#[AllowBackgroundWrite]` tools) |

**Note on the role catalogue.** Persona role bindings must reference the
canonical `Tenancy::defaultRoles()` catalogue:
`owner, admin, branch_manager, coach, athlete, parent_guardian, front_desk, viewer`
(base) + `medical` (sports variants). There is **NO** `head_coach` / `hr` /
`finance` / `staff` role.

## Five owned PHP attributes

- `#[AsAiTool(name, description?)]` — tool discovery marker. Globally unique
  name.
- `#[Sensitivity(level)]` — persona ceiling
  (`Public`/`Pii`/`Financial`/`Medical`/`Safeguarding`).
- `#[RequiresRoles(roles)]` — persona role binding read by AuthorizePersonaRole
  middleware.
- `#[NeverAutoWrite]` — persona-level marker; every tool call routes to draft
  flow regardless of write mode.
- `#[AllowBackgroundWrite]` — tool-level escape hatch for background personas.
  Loses to `#[NeverAutoWrite]` on the persona.

## Four owned enums

- **`Sensitivity`** — `Public` / `Pii` / `Financial` / `Medical` /
  `Safeguarding`. Ordered (rank 1-5); `->covers()` compares. `Safeguarding` is
  hard-denied by SensitiveDataGate.
- **`WriteMode`** — `Read` / `Draft` / `Write`. `Draft` = draft-then-confirm;
  `Write` = direct-write, background-only.
- **`RunStatus`** — `Running` → `Succeeded` / `Failed` / `Cancelled` /
  `RateLimited`. Terminal states are immutable.
- **`DraftStatus`** — `Open` → `Confirmed` / `Expired` / `Discarded`. All
  terminal.

## Seven agent middleware (vendor `AgentMiddleware`)

Every persona's `middleware()` returns:

1. `BindTenantContext` — pins the vendor pipeline to the caller's tenant.
2. `InjectTenantSystemPrompt` — prepends the tenant's system prompt.
3. `SensitiveDataGate` — classifies content sensitivity; refuses persona-ceiling
   breaches.
4. `PiiAnonymizerPipe` — redacts names / emails / phones before provider
   dispatch.
5. `RecordAiRun` — before/after hook creating + finalising the `AiRun` row.
6. `EmitRunSummary` — final summary event for observability.
7. `CheckCancellation` — polls for user cancellation mid-stream.

## Four HTTP middleware

Applied on `POST /ai/chat/{persona}` before the vendor pipeline:

1. `ai.feature` — verifies `ai.personas.<Persona>` feature flag is on for the
   tenant.
2. `ai.rate` — per-user + per-tenant rate limit.
3. `ai.reserve` — reserves tokens from `ai.token_pool.month` entitlement.
4. `ai.persona-role` — reads `#[RequiresRoles]` on the persona; refuses caller.

## MCP support (Enterprise)

`Mcp/ToolServer` exposes tenant AI as an MCP endpoint for external agents
(Claude Desktop, Cursor, Zed). `Mcp/AiToolAdapter` bridges the tool contracts.
Every MCP tool invocation re-runs SensitiveDataGate + persona-role — the MCP
transport doesn't bypass authorization. Enterprise-only per `ai.mcp`
entitlement.

## Frontend contract

`POST /api/ai/chat/{persona}` streams via Vercel AI SDK data-stream protocol
(`->stream()->usingVercelDataProtocol()`). Frontend uses `useChat` — browser
NEVER holds OpenAI/Anthropic keys.

## Guardrails

- **Tenant-scoped context only** — RBAC re-checked inside every tool via
  `ToolAuthorizerDecorator`.
- **Per-tenant AI token pool** via `ai.token_pool.month` entitlement (small:
  100k / medium: 1M / enterprise: 10M+).
- **Medical + safeguarding hard-denied** unless explicit consent + role.
- **PII anonymization** on generic drafting prompts.
- **Full audit** — prompts + responses + tool calls stored with SHA-256 hashes.
- **Draft → present → confirm** for `WriteMode::Draft` tools. Interactive
  personas MUST NOT bundle a `#[AllowBackgroundWrite]` tool.
- **Fail-closed** — LLM/provider errors never grant a bypass.

## ULID prefixes

- `arv_` — AiRun
- `atc_` — AiToolCall
- `adr_` — AiDraft
- `aie_` — AiEmbedding
- `aic_` — AiConversation (tenant metadata wrapper over vendor
  `agent_conversations`)
