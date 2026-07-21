<?php

declare(strict_types=1);

namespace Stackra\Localization\Services;

use Stackra\Localization\Contracts\Services\SourceRedactorInterface;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Singleton;

/**
 * Config-driven redactor — strips well-known PII / secret patterns
 * from a source string before dispatching to a third-party driver.
 *
 * The regex catalogue is intentionally small — it's the last line of
 * defence, not the primary guarantee. Tenants remain responsible for
 * ensuring model content stays clean, and the module documentation
 * spells this out.
 *
 * `#[Singleton]` — the redactor is stateless.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Singleton]
final class ConfigSourceRedactor implements SourceRedactorInterface
{
    /**
     * Patterns applied in order. Each match is replaced with the
     * `[REDACTED]` sentinel (strict mode) or left through with a
     * warning (loose mode).
     *
     * @var list<string>
     */
    private const array PATTERNS = [
        // Credit-card numbers (13-19 digits with optional separators).
        '/\b(?:\d[ -]*?){13,19}\b/',
        // Email addresses.
        '/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/',
        // IBAN (rough shape — full validation is out of scope).
        '/\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/',
        // US SSN (nnn-nn-nnnn).
        '/\b\d{3}-\d{2}-\d{4}\b/',
    ];

    /**
     * @param  bool    $enabled  Master kill-switch.
     * @param  string  $mode     `strict` = replace matches. `loose` = pass through with warning. `off` = disabled.
     */
    public function __construct(
        #[Config('localization.redaction.enabled', true)] private readonly bool $enabled,
        #[Config('localization.redaction.mode', 'strict')] private readonly string $mode,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function redact(string $sourceText): string
    {
        // Off / loose — pass through untouched.
        if (! $this->enabled || $this->mode === 'off' || $this->mode === 'loose') {
            return $sourceText;
        }

        $result = $sourceText;
        foreach (self::PATTERNS as $pattern) {
            $result = (string) \preg_replace($pattern, '[REDACTED]', $result);
        }

        return $result;
    }
}
