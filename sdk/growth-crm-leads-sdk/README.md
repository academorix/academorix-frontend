# academorix-growth/crm-leads-sdk

Wire-visible SDK surface for the `crm-leads` module of the Growth service.
Auto-discovered by `academorix/growth-sdk` (the service umbrella) via
`#[AsSdkResource(name: 'crm-leads', service: 'growth')]`.

## Aggregates

- **lead-activities** — LeadActivity entity.
- **leads** — Lead entity.
- **tasks** — Task entity.

## Layout

```
src/
├── CrmLeadsSdkResource.php     # #[AsSdkResource] — the entry point
├── Data/                     # response DTOs (server -> client)
├── Payloads/<Aggregate>/     # request-body DTOs (client -> server)
├── Requests/<Aggregate>/     # Saloon HTTP-transport classes
├── Resources/                # fluent domain façades
├── Enums/                    # wire-visible backed enums
└── Exceptions/               # domain-typed exceptions (empty by default)
```

Consumed only over HTTP via the umbrella client:

```php
app(\Academorix\GrowthSdk\Client\GrowthSdk::class)
    ->crmLeads()
    ->leadActivities()
    ->list();
```

## Generation

This SDK is regenerated from the blueprint at `modules/growth/crm-leads/`. Do
not hand-edit auto-generated files (they carry an `AUTO-GENERATED` header
comment). Files WITHOUT that header are hand-tuned overrides that survive
regeneration.

```
python3 modules/shared/blueprints/foundation/scripts/generate-sdk.py growth crm-leads
```
