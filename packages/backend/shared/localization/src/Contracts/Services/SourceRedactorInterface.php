<?php

declare(strict_types=1);

namespace Stackra\Localization\Contracts\Services;

use Stackra\Localization\Services\ConfigSourceRedactor;
use Illuminate\Container\Attributes\Bind;

/**
 * Strips PII / secrets from a source string before it reaches a
 * third-party translator driver.
 *
 * Reuses the shared telemetry redactor rules. Consumer apps may
 * rebind this contract to a stricter or looser implementation via
 * `#[Bind]`.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Bind(ConfigSourceRedactor::class)]
interface SourceRedactorInterface
{
    /**
     * Return the passed source string with sensitive matches
     * replaced. When redaction is disabled (`config('localization.redaction.enabled')=false`)
     * the input is returned verbatim.
     *
     * @param  string  $sourceText  The unredacted source string.
     * @return string  The redacted result.
     */
    public function redact(string $sourceText): string;
}
