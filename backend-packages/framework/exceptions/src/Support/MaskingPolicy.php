<?php

/**
 * @file packages/exceptions/src/Support/MaskingPolicy.php
 *
 * @description
 * Immutable policy object that tells the renderer HOW aggressively to
 * mask a given exception on the way out. Kept as a value object so
 * the renderer stays declarative — it asks the policy "should I
 * ship the developer message?" rather than re-checking the env,
 * severity, and caller role at every branch.
 *
 * ## Three axes of masking
 *
 * 1. **`maskMessage`** — replace `$e->getMessage()` with a generic
 *    fallback? True in prod for high-severity errors; false in dev
 *    always.
 * 2. **`maskContext`** — run the exception's `context()` payload
 *    through the `Redactor` before shipping? Almost always true;
 *    only explicit `unmasked()` policies (support-admin views)
 *    disable it.
 * 3. **`includeDebug`** — attach class/file/line/trace? True in
 *    dev-like envs; false otherwise. Sentry always sees the trace
 *    regardless — this flag only controls the HTTP response body.
 *
 * ## Factories
 *
 * - `forRequest(env, severity)` — the default renderer path.
 * - `unmasked()` — internal admin / support views; assume the
 *   caller has already checked their own authorisation.
 * - `fullyMasked()` — belt-and-braces fallback; masks everything.
 *
 * The class is `final` and `readonly` so the policy travels through
 * the pipeline without anyone mutating it mid-render.
 */

declare(strict_types=1);

namespace Academorix\Exceptions\Support;

use Academorix\Exceptions\Enums\ErrorSeverity;
use Academorix\Foundation\Enums\AppEnvironment;

final readonly class MaskingPolicy
{
    public function __construct(
        public bool $maskMessage,
        public bool $maskContext,
        public bool $includeDebug,
    ) {
    }

    /**
     * Default policy for outbound HTTP responses.
     *
     * - Debug info (`class`, `file`, `line`, `trace`) is only ever
     *   attached in dev-like envs.
     * - Messages are masked in prod-like envs when the severity is
     *   high enough that a raw string could leak internals.
     * - Context is always redacted through the `Redactor`. There
     *   are no envs where we want to ship raw context to clients.
     */
    public static function forRequest(AppEnvironment $env, ErrorSeverity $severity): self
    {
        return new self(
            maskMessage: $env->isProductionLike() && $severity->shouldMaskMessageInProd(),
            maskContext: true,
            includeDebug: $env->isDebuggable(),
        );
    }

    /**
     * Admin / support view. Callers assume they've already checked
     * their own authorisation before opting in.
     */
    public static function unmasked(): self
    {
        return new self(
            maskMessage: false,
            maskContext: false,
            includeDebug: true,
        );
    }

    /** Everything masked. Safe last resort. */
    public static function fullyMasked(): self
    {
        return new self(
            maskMessage: true,
            maskContext: true,
            includeDebug: false,
        );
    }
}
