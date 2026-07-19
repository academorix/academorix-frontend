# ai

Backend-first AI substrate per blueprint §10.21. D6 LOCKED — browser never holds
LLM keys. Wave 4.

## Owned entities

- `AiConversation` (`aic_`) — persona-scoped chat with a User.
- `AiRun` (`arv_`) — single model invocation with tokens + cost + latency.
- `AiToolCall` (`atc_`) — individual tool invocation inside a run.
- `AiEmbedding` (`aie_`) — pgvector embedding for RAG search.

## Three-layer architecture

1. **AI module** — owns tools, agents, provider calls, tenant scoping, audit.
2. **Domain modules** — contribute tools via `#[AsAiTool]`.
3. **Personas** — bundle tool set + system prompt + guardrails via
   `#[AsAiPersona]`.

## Built-in personas

- `CoachAssistant` — coach + drill search + session-plan gen (own teams only).
- `ParentAssistant` — parent + own-children only (strictest PII/RBAC).
- `AdminAssistant` — admin + all read + run_report (tenant-wide, audit-heavy).
- `FinanceAssistant` — revenue/expense + dunning-draft.
- `HeadCoachAssistant` — coach + scouting + cross-team.
- `MedicalAssistant` — medical role only + RTP-summary draft (never autonomous).
- `AnomalyDetector` (bg) — nightly attendance/injury pattern scan.
- `NotificationDrafter` (bg) — weekly digests.
- `SearchIndexer` (bg) — embedding builder.

## Guardrails

- **Tenant-scoped context only** — RBAC re-checked inside every tool.
- **Per-tenant AI-token pool** via entitlements.
- **Medical + safeguarding data NEVER sent** without explicit consent.
- **PII anonymization pipe** on generic drafting prompts.
- **Full audit** — prompts + responses + tool calls stored.
- **Draft → present → confirm** for write-back tools (no autonomous execution).
- **Fail-closed** — LLM errors never grant bypass.

## Frontend contract

`POST /api/ai/chat/{persona}` streams via Vercel AI SDK data-stream protocol.
Frontend uses `useChat` — browser NEVER holds OpenAI/Anthropic keys.

## ULID prefixes

- `aic_`, `arv_`, `atc_`, `aie_`
