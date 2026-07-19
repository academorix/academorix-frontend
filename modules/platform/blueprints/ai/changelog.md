# ai — changelog

## [Unreleased] — inception (Wave 4)

- Four entities: AiConversation / AiRun / AiToolCall / AiEmbedding.
- Backend-first (D6 locked) — browser never holds provider keys.
- Wraps `laravel/ai` (first-party). Provider-agnostic via AiProvider contract.
- Nine built-in personas including AnomalyDetector / SearchIndexer as background
  workers.
- Attribute-driven tool discovery via `#[AsAiTool]` + persona registration via
  `#[AsAiPersona]`.
- Full audit: every prompt + response + tool call stored with SHA-256 hashes.
- Per-tenant AI-token pool via entitlements (small: 100k, medium: 1M,
  enterprise: 10M+).
- SensitiveDataGate refuses medical/safeguarding data without explicit consent.
- 9 events including `SensitiveDataBlocked` and `TokenPoolExhausted`.

### Dependencies

- `foundation`, `tenancy`, `application`, `user`, `entitlements`, `storage`,
  `search`, `audit`, `activity`, `compliance`, `notifications`.

### ULID prefixes

- `aic_`, `arv_`, `atc_`, `aie_` — registered.
