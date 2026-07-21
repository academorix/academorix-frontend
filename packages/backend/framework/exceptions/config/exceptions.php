<?php

/**
 * @file packages/exceptions/config/exceptions.php
 *
 * @description
 * Configuration for the exceptions package. Merged into the host
 * app's config as `exceptions.*` by
 * {@see \Stackra\Exceptions\Providers\ExceptionsServiceProvider}.
 *
 * Every runtime source reads through `env('EXCEPTIONS_*')` so
 * Doppler-injected secrets flow through `config:cache` cleanly.
 * No secret ever lives in this file directly.
 *
 * ## Consumers at a glance
 *
 *   - `docs_url`         — {@see \Stackra\Exceptions\Formatters\JsonErrorFormatter}
 *                          builds `error.type` from this base.
 *   - `ai_solutions.*`   — {@see \Stackra\Exceptions\Ignition\AiSolutionsProvider}
 *                          gates AI-powered Ignition suggestions.
 *   - `locale`           — Reserved for future per-package locale
 *                          override; today the translator falls back
 *                          to Laravel's `app.locale`.
 *   - `render.*`         — Controls what {@see \Stackra\Exceptions\Formatters\JsonErrorFormatter}
 *                          emits inside the `debug` and `meta` blocks.
 *   - `redaction.*`      — Injected into {@see \Stackra\Exceptions\Support\Redactor}
 *                          via the service provider closure.
 *   - `traces.*`         — Injected into {@see \Stackra\Exceptions\Support\TraceCleaner}.
 *   - `log.channels`     — Read at report-time by
 *                          {@see \Stackra\Exceptions\Reporters\LogReporter}.
 */

declare(strict_types=1);

return [

    /*
    |----------------------------------------------------------------------
    | Documentation URL
    |----------------------------------------------------------------------
    |
    | Base URL used to build the `error.type` field in every JSON
    | response. Set this to your docs site so clients can click
    | through to the human-readable explanation of every error code:
    |
    |     https://docs.stackra.com/errors/http.validation
    |
    | When empty (default), the renderer emits a stable but
    | non-clickable `urn:stackra:error:<code>` so the field
    | shape stays consistent.
    |
    | Override in Doppler:
    |
    |     EXCEPTIONS_DOCS_URL=https://docs.stackra.com/errors
    */

    'docs_url' => env('EXCEPTIONS_DOCS_URL', ''),

    /*
    |----------------------------------------------------------------------
    | AI-augmented Ignition solutions
    |----------------------------------------------------------------------
    |
    | The AI solution provider delegates to `laravel/ai` — the
    | provider, model, and API keys live in the SDK's own
    | `config/ai.php`. This block only toggles WHETHER the Ignition
    | solution provider fires; it does not configure the model.
    |
    | Turn it on locally by setting `EXCEPTIONS_AI_SOLUTIONS=true`
    | in Doppler. Keep it OFF in prod / CI / staging so no LLM call
    | ever runs against production traffic.
    */

    'ai_solutions' => [
        'enabled' => (bool) env('EXCEPTIONS_AI_SOLUTIONS', false),
    ],

    /*
    |----------------------------------------------------------------------
    | Translation
    |----------------------------------------------------------------------
    |
    | The package's translation catalogue is loaded under the
    | `exceptions` namespace and lives under `lang/{locale}/{group}.php`
    | (`auth.php`, `http.php`, `domain.php`, `infrastructure.php`,
    | `generic.php`).
    |
    | `locale` is a reserved override — leaving it null lets the
    | translator use Laravel's `app.locale`. Set it explicitly if a
    | subset of your app should always render error copy in a
    | specific language regardless of the request locale.
    |
    | `fallback_locale` mirrors `app.fallback_locale` so a missing
    | key in `es` falls through to `en` before falling out entirely
    | to the literal `$userMessage` on the exception.
    */

    'locale' => env('EXCEPTIONS_LOCALE'),

    'fallback_locale' => env('EXCEPTIONS_FALLBACK_LOCALE', 'en'),

    /*
    |----------------------------------------------------------------------
    | Rendering
    |----------------------------------------------------------------------
    |
    | Controls what {@see \Stackra\Exceptions\Formatters\JsonErrorFormatter}
    | emits back to clients.
    |
    |   - `render_context_in_debug` — echoes the exception `context()`
    |     map inside `meta.context` in debuggable environments (local
    |     / testing / dev). Always suppressed in production-like
    |     envs regardless of this value; the
    |     {@see \Stackra\Exceptions\Support\MaskingPolicy} has
    |     the final say.
    |
    |   - `trace_frames` — Upper bound on the number of stack frames
    |     shipped inside `debug.trace`. Duplicated as the default
    |     for {@see \Stackra\Exceptions\Support\TraceCleaner}
    |     under `traces.max_frames` so downstream consumers can pin
    |     the trace budget separately from the response body.
    */

    'render' => [
        'trace_frames' => (int) env('EXCEPTIONS_RENDER_TRACE_FRAMES', 20),
        'render_context_in_debug' => (bool) env('EXCEPTIONS_RENDER_CONTEXT_IN_DEBUG', true),
    ],

    /*
    |----------------------------------------------------------------------
    | Sensitive data redaction
    |----------------------------------------------------------------------
    |
    | Configuration for {@see \Stackra\Exceptions\Support\Redactor}.
    | The redactor ships with a comprehensive set of sensitive keys
    | and regex patterns (see `Redactor::DEFAULT_SENSITIVE_KEYS` and
    | `Redactor::DEFAULT_SENSITIVE_PATTERNS`); values declared here
    | LAYER ON TOP of the defaults — they never replace them.
    |
    |   - `replacement`        — Marker string swapped in for redacted
    |                            values. Keep it short and obviously
    |                            not-a-value so log-line consumers can
    |                            distinguish "redacted" from "empty".
    |
    |   - `max_depth`          — Recursion guard for nested arrays.
    |                            Payloads deeper than this ship as a
    |                            single `[REDACTED]` marker.
    |
    |   - `max_string_length`  — Cap on scalar string length. Longer
    |                            strings are truncated with an
    |                            ellipsis so an accidentally-attached
    |                            request body doesn't blow the log
    |                            line.
    |
    |   - `sensitive_keys`     — Extra substring rules for the array
    |                            key check (case-insensitive). Add
    |                            company-specific field names here.
    |                            Example: `['account_pin', 'sso_uid']`.
    |
    |   - `sensitive_patterns` — Extra regex rules for free-form
    |                            strings. Each entry is a regex
    |                            delimited with `~` — matched text is
    |                            replaced inline. Example:
    |                            `['~BLOCK-\d{6}~' => '[REDACTED:block]']`.
    */

    'redaction' => [
        'replacement' => (string) env('EXCEPTIONS_REDACT_REPLACEMENT', '[REDACTED]'),
        'max_depth' => (int) env('EXCEPTIONS_REDACT_MAX_DEPTH', 8),
        'max_string_length' => (int) env('EXCEPTIONS_REDACT_MAX_STRING_LENGTH', 2048),

        'sensitive_keys' => [
            // Layered on top of Redactor::DEFAULT_SENSITIVE_KEYS.
            // Add extra keys here — do NOT duplicate the defaults.
            // 'account_pin',
            // 'external_reference',
        ],

        'sensitive_patterns' => [
            // Layered on top of Redactor::DEFAULT_SENSITIVE_PATTERNS.
            // Each entry maps a label => PCRE pattern string.
            // 'internal_block_id' => '~BLOCK-\d{6}~',
        ],
    ],

    /*
    |----------------------------------------------------------------------
    | Stack-trace cleaning
    |----------------------------------------------------------------------
    |
    | Configuration for {@see \Stackra\Exceptions\Support\TraceCleaner}.
    | The cleaner turns raw PHP traces into the safe subset shipped
    | in error responses and log lines.
    |
    |   - `strip_paths`     — When true (default), absolute paths get
    |                         rewritten to project-relative so
    |                         container / host filesystem layout
    |                         never leaks. `base_path()` is used as
    |                         the root; passed by the service
    |                         provider at bind time.
    |
    |   - `collapse_vendor` — When true, consecutive frames living
    |                         under `vendor/` collapse into a single
    |                         summary frame so the "real" call site
    |                         surfaces higher. Off by default because
    |                         framework frames often carry the actual
    |                         hint (which listener, which macro).
    |
    |   - `max_frames`      — Upper bound on frames returned per
    |                         trace. Matches `render.trace_frames`
    |                         by default so the response body budget
    |                         and the log-line budget stay aligned.
    */

    'traces' => [
        'strip_paths' => (bool) env('EXCEPTIONS_TRACE_STRIP_PATHS', true),
        'collapse_vendor' => (bool) env('EXCEPTIONS_TRACE_COLLAPSE_VENDOR', false),
        'max_frames' => (int) env('EXCEPTIONS_TRACE_MAX_FRAMES', 20),
    ],

    /*
    |----------------------------------------------------------------------
    | Log routing
    |----------------------------------------------------------------------
    |
    | The custom {@see \Stackra\Exceptions\Reporters\LogReporter}
    | routes exceptions to different channels by category — so
    | security-relevant events land in an audit-friendly channel and
    | integration failures land where SRE looks.
    |
    | Keys mirror {@see \Stackra\Exceptions\Enums\ErrorCategory}
    | values. `null` (or an unknown channel name) falls back to the
    | log manager's default channel. Every channel referenced here
    | MUST exist in the host app's `config/logging.php` — otherwise
    | the reporter silently falls back to default.
    |
    | Override the mapping via Doppler per channel; leaving an env
    | var unset keeps the framework-provided fallback for that
    | category.
    */

    'log' => [
        'channels' => [
            'security' => env('EXCEPTIONS_LOG_CHANNEL_SECURITY', 'security'),
            'tenancy' => env('EXCEPTIONS_LOG_CHANNEL_TENANCY', 'security'),
            'integration' => env('EXCEPTIONS_LOG_CHANNEL_INTEGRATION', 'upstream'),
            'infrastructure' => env('EXCEPTIONS_LOG_CHANNEL_INFRA', 'daily'),
            'authentication' => env('EXCEPTIONS_LOG_CHANNEL_AUTH'),
            'authorization' => env('EXCEPTIONS_LOG_CHANNEL_AUTH'),
            'validation' => env('EXCEPTIONS_LOG_CHANNEL_VALIDATION'),
            'conflict' => env('EXCEPTIONS_LOG_CHANNEL_VALIDATION'),
            'rate_limit' => env('EXCEPTIONS_LOG_CHANNEL_VALIDATION'),
            'not_found' => env('EXCEPTIONS_LOG_CHANNEL_VALIDATION'),
            'feature_flag' => env('EXCEPTIONS_LOG_CHANNEL_VALIDATION'),
            'billing' => env('EXCEPTIONS_LOG_CHANNEL_BILLING'),
            'business' => env('EXCEPTIONS_LOG_CHANNEL_BUSINESS'),
            'unexpected' => env('EXCEPTIONS_LOG_CHANNEL_UNEXPECTED'),
        ],
    ],

];
