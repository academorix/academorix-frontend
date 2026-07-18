# Exception design guide

This file is prescriptive — every code review touching exception
handling should reference back to it. It answers four questions:

1. **What exceptions ship in the box?** — the full catalogue.
2. **How do I choose the right one?** — the decision tree.
3. **What SHOULD we add next?** — the wish list.
4. **How do I author a new subclass?** — the conventions.

## 1. Shipped catalogue

Grouped by concern, not HTTP status — a 422 could be validation OR
business, and dashboards need to tell them apart.

### Auth

| Class | HTTP | Category | Severity | Translation key |
|---|---|---|---|---|
| `AuthenticationException` | 401 | authentication | warning | `auth.unauthenticated` |
| `TokenExpiredException` | 401 | authentication | warning | `auth.token_expired` |
| `ForbiddenException` | 403 | authorization | warning | `auth.forbidden` |
| `FeatureDisabledException` | 403 | feature_flag | info | `auth.feature_disabled` |

### HTTP boundary

| Class | HTTP | Category | Severity | Translation key |
|---|---|---|---|---|
| `NotFoundException` | 404 | not_found | info | `http.not_found` |
| `EntityNotFoundException` | 404 | not_found | info | `http.entity_not_found` |
| `MethodNotAllowedException` | 405 | not_found | info | `http.method_not_allowed` |
| `ConflictException` | 409 | conflict | info | `http.conflict` |
| `PayloadTooLargeException` | 413 | validation | info | `http.payload_too_large` |
| `UnsupportedMediaTypeException` | 415 | validation | info | `http.unsupported_media_type` |
| `ValidationException` | 422 | validation | info | `http.validation` |
| `UnprocessableEntityException` | 422 | business | info | `http.unprocessable` |
| `TooManyRequestsException` | 429 | rate_limit | notice | `http.too_many_requests` |
| `PaymentRequiredException` | 402 | billing | info | `billing.payment_required` |

### Domain

| Class | HTTP | Category | Severity | Translation key |
|---|---|---|---|---|
| `DomainException` | 422 | business | info | `domain.rule_violated` |
| `BusinessRuleException` | 422 | business | info | `domain.business_rule` |
| `InvariantViolationException` | 500 | business | critical | `domain.invariant_violation` |
| `TenantException` | 400 | tenancy | warning | `tenancy.missing` |

### Infrastructure

| Class | HTTP | Category | Severity | Translation key |
|---|---|---|---|---|
| `IntegrationException` | 502 | integration | error | `infrastructure.integration` |
| `TimeoutException` | 504 | integration | warning | `infrastructure.timeout` |
| `ServiceUnavailableException` | 503 | infrastructure | critical | `infrastructure.unavailable` |
| `MaintenanceModeException` | 503 | infrastructure | critical | `infrastructure.maintenance` |
| `ConfigurationException` | 500 | infrastructure | emergency | `infrastructure.configuration` |
| `UnexpectedException` | 500 | unexpected | critical | `unexpected` |

## 2. Decision tree

```
Is the throwable a bug (impossible state, misconfig, panic)?
├── Yes → InvariantViolationException / ConfigurationException  (5xx, severity=Critical+)
└── No, it's expected
    ├── Missing / bad credentials?             → AuthenticationException | TokenExpiredException
    ├── Authenticated but denied?              → ForbiddenException | FeatureDisabledException
    ├── Resource missing?                      → EntityNotFoundException | NotFoundException
    ├── Client sent bad shape?                 → ValidationException (field-level) | Unsupported* | PayloadTooLarge
    ├── Client sent good shape, bad semantics? → UnprocessableEntityException | BusinessRuleException
    ├── State conflict?                        → ConflictException::{duplicate|optimisticLock|invalidTransition}
    ├── Throttled?                             → TooManyRequestsException::exceeded
    ├── Billing constraint?                    → PaymentRequiredException::{seatLimitReached|planUpgradeRequired|insufficientBalance}
    ├── Tenant scope wrong?                    → TenantException::{missingTenant|crossTenantAccess}
    ├── 3rd-party failed?                      → IntegrationException::upstream | TimeoutException::afterSeconds
    └── Internal dependency down?              → ServiceUnavailableException::dependency
```

## 3. What to add next (wish list)

Add when a use case actually shows up — don't pre-empt them. Each
entry lists the recommended base class to extend.

### Near-term (as we migrate the existing 44 packages)

| Class | HTTP | Extends | Notes |
|---|---|---|---|
| `IdempotencyKeyReplayException` | 409 | `ConflictException` | Carry the original response so retries return the same body. |
| `AttendanceLockedException` | 423 | `DomainException` | Once a coach has closed attendance for a session, retroactive edits are forbidden. HTTP 423 (Locked). |
| `SlotUnavailableException` | 409 | `ConflictException` | Two clients tried to grab the same slot. |
| `ContentModerationBlockedException` | 451 | `AcademorixException` | Content flagged by moderation. HTTP 451 (unavailable for legal reasons). |
| `ExportTooLargeException` | 400 | `AcademorixException` | Client asked for more than N rows; suggest date-range narrowing. |
| `WebhookSignatureInvalidException` | 400 | `ForbiddenException` | Severity=Alert, category=Security. |

### AI-service specific (once `apps/ai-service` lands)

| Class | HTTP | Extends | Notes |
|---|---|---|---|
| `AiProviderQuotaExceededException` | 429 | `TooManyRequestsException` | Carries provider-specific `retryAfter`. |
| `AiPromptTooLongException` | 400 | `ValidationException` | Input exceeded provider token limit. |
| `AiSafetyRefusalException` | 451 | `AcademorixException` | Model refused on safety grounds; log for review, don't retry. |
| `AiToolCallLoopException` | 500 | `InvariantViolationException` | Agent looped past `MAX_TOOL_CALLS`. |
| `AiCitationMissingException` | 502 | `IntegrationException` | Required RAG citation missing from output. |

### Domain-specific (as domains land)

| Class | HTTP | Package |
|---|---|---|
| `LivenessCheckFailedException` | 400 | `academorix/identity` |
| `ConsentNotGrantedException` | 403 | `academorix/consent` |
| `SubscriptionPastDueException` | 402 | `academorix/billing` (subclass of `PaymentRequiredException`) |
| `MigrationVersionMismatchException` | 500 | `academorix/db` |

## 4. Authoring conventions

- **`public const CODE`** — every subclass declares one. phpstan
  level-8 makes the missing constant visible.
- **`public const TRANSLATION_KEY`** — every subclass declares one,
  pointing at `exceptions::errors.<package>.<event>`. Add the
  matching entry to `resources/lang/en/errors.php` (and translate
  the other locales, or delegate to a sub-agent).
- **Static `::make()`** — inherited from the base. Named factories
  MUST delegate to `::make()` rather than calling `new self(...)`
  so subclass typing is preserved.
- **Fluent chain over constructor args** — factories that need
  context / replacements / user message use
  `->withContext(...)->withTranslationReplacements(...)`.
- **Never** throw `\Exception`, `\RuntimeException`,
  `\InvalidArgumentException` from domain code. Those types are
  for guards (`Assert::*` in `academorix/foundation`) and adapters
  that translate them to a domain exception on the way out.
- **Never** put user IDs / emails / tokens directly in
  `$e->getMessage()`. Put them in `->withContext([...])` — the
  masker will still redact obvious matches but it's cheaper (and
  more correct) not to rely on it.
- **Prefer** `severity = Info` for expected client errors (4xx)
  so Sentry / LogReporter don't page on them. Reserve `Error+` for
  actual bugs.
- **Prefer** `userMessage` written in the second person, present
  tense, ≤ 120 chars. Assume it will be rendered directly to a
  human.
- **Translation placeholders** — use `:snake_case`. The named
  factory passes them via `->withTranslationReplacements([...])`.
  Placeholders MUST appear in every locale's translation values.

### Example: adding a new exception

```php
// packages/billing/src/Exceptions/InvoiceOverdueException.php
final class InvoiceOverdueException extends AcademorixException
{
    public const CODE = 'billing.invoice.overdue';
    public const TRANSLATION_KEY = 'exceptions::errors.billing.invoice_overdue';

    protected ErrorSeverity $severity = ErrorSeverity::Info;
    protected ErrorCategory $category = ErrorCategory::Billing;
    protected int $httpStatus = 402;

    public static function forInvoice(string $invoiceId, int $daysOverdue): static
    {
        return static::make("Invoice {$invoiceId} is {$daysOverdue}d overdue.")
            ->withContext([
                'invoice_id' => $invoiceId,
                'days_overdue' => $daysOverdue,
            ])
            ->withTranslationReplacements([
                'invoice_id' => $invoiceId,
                'days' => $daysOverdue,
            ]);
    }
}
```

And in `resources/lang/en/errors.php`:

```php
'billing' => [
    // ...existing keys...
    'invoice_overdue' => 'Invoice :invoice_id is :days days overdue.',
],
```

Then translate the same key into `fr`, `es`, `ar`. Add tests in
`tests/Unit/`. Ship.
