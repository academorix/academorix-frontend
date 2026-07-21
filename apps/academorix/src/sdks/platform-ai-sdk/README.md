# stackra-platform/ai-sdk

Wire-visible SDK surface for the `ai` module of the Platform service.
Auto-discovered by `stackra/platform-sdk` (the service umbrella) via
`#[AsSdkResource(name: 'ai', service: 'platform')]`.

## Aggregates

- **ai-conversations** — AiConversation entity.
- **ai-drafts** — Draft-then-confirm envelope for WriteMode::Draft tool
  invocations
- **ai-embeddings** — Vector embedding for RAG search
- **ai-runs** — AiRun entity.
- **ai-tool-calls** — AiToolCall entity.

## Layout

```
src/
├── AiSdkResource.php     # #[AsSdkResource] — the entry point
├── Data/                     # response DTOs (server -> client)
├── Payloads/<Aggregate>/     # request-body DTOs (client -> server)
├── Requests/<Aggregate>/     # Saloon HTTP-transport classes
├── Resources/                # fluent domain façades
├── Enums/                    # wire-visible backed enums
└── Exceptions/               # domain-typed exceptions (empty by default)
```

Consumed only over HTTP via the umbrella client:

```php
app(\Stackra\PlatformSdk\Client\PlatformSdk::class)
    ->ai()
    ->aiConversations()
    ->list();
```

## Generation

This SDK is regenerated from the blueprint at `modules/platform/ai/`. Do not
hand-edit auto-generated files (they carry an `AUTO-GENERATED` header comment).
Files WITHOUT that header are hand-tuned overrides that survive regeneration.

```
python3 modules/shared/blueprints/foundation/scripts/generate-sdk.py platform ai
```
