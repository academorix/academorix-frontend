# stackra/exceptions

Structured exception hierarchy, translation-aware user messages, sensitive-data
masking, JSON error renderer, structured log reporter, Sentry context
enrichment, and Spatie Ignition + `laravel/ai` solution providers for every
Stackra app and package. Depends on [`stackra/foundation`](../foundation).

## What you get in one line

```php
// bootstrap/app.php
->withExceptions(function (Exceptions $exceptions): void {
    \Stackra\Exceptions\Support\ExceptionsBootstrap::configure($exceptions);
})
```

That single call gives you:

- Every throwable rendered as a uniform RFC 7807-flavoured JSON envelope
- Every 4xx / 5xx tagged with a stable `errorCode`
- Sensitive fields (`password`, `token`, `Bearer …`, JWTs, Stripe keys, JWTs,
  credit cards, emails, ...) redacted from responses, logs, and Sentry events by
  a shared masker
- Structured JSON log lines at the correct PSR-3 severity per exception, routed
  to per-category channels
- Sentry events enriched with `errorCode`, `category`, `severity`,
  `correlation_id`, `tenant_id`, `route`
- Deterministic Ignition solution hints for our own exception types in dev
- Opt-in AI-generated fix suggestions via `laravel/ai` (provider-agnostic —
  OpenAI, Anthropic, Gemini, Ollama, ...)

## Response shape

```json
{
  "error": {
    "type": "urn:stackra:error:http.validation",
    "code": "http.validation",
    "title": "Please review the highlighted fields and try again.",
    "status": 422,
    "detail": "Validation failed.",
    "correlationId": "01H5MZ8...",
    "fields": [
      { "field": "email", "messages": ["Not a valid email address."] }
    ],
    "meta": {
      "severity": "info",
      "category": "validation"
    }
  }
}
```

In `local` / `testing` / `development` envs the envelope also includes
`error.meta.context` (masked structured metadata) and `error.debug` (class,
file, line, first 20 stack frames, previous throwable, also masked). Both are
suppressed in `staging` / `production`.

## Throwing exceptions in your code

Prefer domain-specific classes with named factories. Every class inherits
`::make()` from the base for the free-form path:

```php
use Stackra\Exceptions\Http\ValidationException;
use Stackra\Exceptions\Http\ConflictException;
use Stackra\Exceptions\Http\TooManyRequestsException;
use Stackra\Exceptions\Domain\BusinessRuleException;
use Stackra\Exceptions\Auth\ForbiddenException;

// Named factory — the preferred style
throw ForbiddenException::missingPermission('billing.write');

throw ValidationException::withErrors([
    'email' => 'This email is already registered.',
]);

throw ConflictException::optimisticLock(
    resource: 'invoice',
    expected: $request->input('_version'),
    actual:   $invoice->version,
);

throw TooManyRequestsException::exceeded(30, 'api');

throw BusinessRuleException::ruleFailed(
    'billing.trial_only_once',
    'A tenant may only start a trial one time.',
);

// Free-form via ::make() when the failure doesn't have a name yet
throw ForbiddenException::make('Custom denial reason.')
    ->withContext(['user_id' => $user->id])
    ->withUserMessage('You cannot do that right now.');
```

Framework throwables you don't own — Laravel's own `ValidationException`,
`ModelNotFoundException`, Symfony HTTP exceptions — are transparently converted
by `ExceptionMapper`, so the response shape stays uniform even for exceptions
you never touched.

## Translation

Every exception carries a `TRANSLATION_KEY` constant pointing at
`exceptions::errors.<path>`. The package ships four locales out of the box:

| Locale  | File                           |
| ------- | ------------------------------ |
| English | `resources/lang/en/errors.php` |
| French  | `resources/lang/fr/errors.php` |
| Spanish | `resources/lang/es/errors.php` |
| Arabic  | `resources/lang/ar/errors.php` |

Placeholders (`:permission`, `:role`, `:resource`, `:rule_id`, `:from`, `:to`,
`:ability`, ...) are interpolated from the exception's `translationReplacements`
map, populated by the named factories. Missing keys fall through to the
exception's literal `$userMessage` if set, otherwise to `null` (renderer picks
its own default title).

Add a locale:

```bash
cp packages/exceptions/resources/lang/en/errors.php \
   packages/exceptions/resources/lang/de/errors.php
# translate values, keep placeholders verbatim
```

Publish the catalogue into an app for per-app overrides:

```bash
php artisan vendor:publish --tag=exceptions-translations
# writes to lang/vendor/exceptions/*
```

## Sensitive data masking

The `SensitiveDataMasker` (`Stackra\Exceptions\Support\SensitiveDataMasker`)
runs at every egress boundary — JSON response, log line, Sentry event. It:

- **Redacts sensitive keys** by case-insensitive substring match (`password`,
  `secret`, `api_key`, `token`, `bearer`, `ssn`, `card_number`, `cvc`,
  `stripe_secret`, ...)
- **Redacts sensitive patterns** in free-form strings (Bearer / Basic auth
  headers, JWTs, Stripe / GitHub / OpenAI / Slack / AWS keys, credit-card-shaped
  numbers, emails — partial mask)
- **Rewrites stack-trace file paths** to repo-relative (strips the container /
  host path prefix)
- **Unwraps `#[SensitiveParameter]`** metadata (PHP 8.2+)

Extend via config:

```php
// config/exceptions.php
'masking' => [
    'extra_keys' => ['company_pin', 'external_reference'],
    'extra_patterns' => [
        ['pattern' => '/BLOCK-\d{6}/', 'replacement' => '[REDACTED:block]'],
    ],
    'base_paths' => [/* extra paths beyond base_path() */],
    'max_depth' => 10,
],
```

Temporarily disable masking (support consoles, integration tests that need the
raw payload):

```php
use Stackra\Exceptions\Support\SensitiveDataMasker;

$raw = SensitiveDataMasker::reveal(function () use ($masker, $context) {
    return $masker->maskArray($context); // returns unmasked here
});
```

`reveal()` is stack-scoped and restores masking on exit, even on exception.
Never wrap production HTTP handlers with it.

## Structured log reporter

`LogReporter` (`Stackra\Exceptions\Reporting\LogReporter`) writes a JSON log
line per exception:

```json
{
  "level": "warning",
  "message": "Missing permission \"billing.write\".",
  "context": {
    "error_code": "auth.forbidden",
    "error_category": "authorization",
    "error_severity": "warning",
    "http_status": 403,
    "correlation_id": "01H5MZ8...",
    "context": { "permission": "billing.write" },
    "request": { "route": "billing.invoices.update", "user_id": "u_123" },
    "trace": [...]
  }
}
```

- **PSR-3 level from severity** — Warning/Info stay out of alert channels,
  Error+ page on-call.
- **Category-routed channels** — security events to `security`, integration
  failures to `upstream`, everything else to `daily`. All configurable
  per-category in `exceptions.log.channels`.
- **Masked** — same masker Sentry uses.
- **Short-circuits Laravel's default reporter** — no duplicate unstructured log
  lines.

## Ignition + AI solutions

Two providers registered when Ignition is installed:

- **`StackraSolutionsProvider`** — deterministic hints for our own exception
  types (`ConfigurationException` → "check Doppler", `IntegrationException` →
  "check upstream status page", ...)
- **`StackraAiSolutionsProvider`** — delegates to the first-party
  [Laravel AI SDK](https://laravel.com/docs/13.x/ai-sdk). Provider, model, and
  API keys come from `config/ai.php` — the SDK's own config — so switching from
  OpenAI to Anthropic to Ollama is a single-line change.

Toggle AI suggestions in Doppler:

```
EXCEPTIONS_AI_SOLUTIONS=true
```

Then set your provider in `config/ai.php` per the SDK docs.

## Public API

| Namespace                                                        | Purpose                                                                     |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `Stackra\Exceptions\StackraException`                      | Base class. Provides `::make()`, translation, masking hook, fluent setters. |
| `Stackra\Exceptions\Enums\ErrorSeverity`                      | PSR-3 aligned severity.                                                     |
| `Stackra\Exceptions\Enums\ErrorCategory`                      | Coarse bucket for dashboards.                                               |
| `Stackra\Exceptions\Support\ExceptionsBootstrap::configure()` | Single-call wiring for `bootstrap/app.php`.                                 |
| `Stackra\Exceptions\Support\ExceptionMapper`                  | Framework → Stackra translator.                                          |
| `Stackra\Exceptions\Support\SensitiveDataMasker`              | Redactor used at every egress boundary.                                     |
| `Stackra\Exceptions\Http\Responses\JsonErrorRenderer`         | Invokable JSON response builder.                                            |
| `Stackra\Exceptions\Middleware\CaptureExceptionContext`       | Snapshots request metadata for reporters.                                   |
| `Stackra\Exceptions\Reporting\LogReporter`                    | Structured, masked, PSR-3-aware log writer.                                 |
| `Stackra\Exceptions\Reporting\SentryContextEnricher`          | Sentry scope enrichment.                                                    |
| `Stackra\Exceptions\Ignition\StackraSolutionsProvider`     | Deterministic Ignition solutions.                                           |
| `Stackra\Exceptions\Ignition\StackraAiSolutionsProvider`   | AI-powered Ignition solutions via `laravel/ai`.                             |

## Testing

```bash
pnpm turbo run test --filter=@stackra/exceptions
```

The full catalogue of shipped classes + the "what to add next" list lives in
[`RECOMMENDATIONS.md`](./RECOMMENDATIONS.md).

See parent [`docs/package-authoring.md`](../../docs/package-authoring.md).
