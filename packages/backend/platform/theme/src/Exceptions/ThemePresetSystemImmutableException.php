<?php

declare(strict_types=1);

namespace Stackra\Theme\Exceptions;

use Stackra\Exceptions\AcademorixException;
use Stackra\Exceptions\Enums\ErrorCategory;
use Stackra\Exceptions\Enums\ErrorSeverity;

/**
 * Raised when a caller attempts to mutate a system-marked `theme_presets`
 * row (`is_system = true`) outside the sanctioned mutation-allowed scope.
 *
 * The mutation-allowed scope is opened only by the seeder (via
 * {@see \Stackra\Theme\Models\ThemePreset::allowSystemMutation()}) and
 * by tests that fixture system state. Every other write path — HTTP admin
 * mutations, Tinker one-liners, ad-hoc migrations — is refused by the
 * model's observer.
 *
 * Mirrors the shape of {@see \Stackra\Application\Exceptions\SystemRowImmutableException}
 * but carries a theme-scoped error code so log filters + i18n stay clean.
 *
 * @category Theme
 *
 * @since    0.1.0
 */
final class ThemePresetSystemImmutableException extends AcademorixException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'theme.preset.system_row_immutable';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'theme::errors.preset_system_row_immutable';

    /**
     * HTTP status override — 422 (unprocessable entity). The row
     * exists and the actor may hold the permission bit; the write
     * is refused because the row's `is_system = true` invariant
     * forbids it.
     */
    protected int $httpStatus = 422;

    /**
     * Log-level severity — refused writes on a locked system row are
     * noteworthy but not error-grade. Reporters emit at PSR-3 `warning`.
     */
    protected ErrorSeverity $severity = ErrorSeverity::Warning;

    /**
     * Category — business-rule violation, not infrastructure.
     */
    protected ErrorCategory $category = ErrorCategory::Business;

    /**
     * Convenience factory used by the observer's raise path.
     *
     * @param  string  $action  `update` / `delete` — the attempted operation.
     * @param  string  $rowId   The primary key of the row that refused the write.
     */
    public static function forAction(string $action, string $rowId): self
    {
        return (new self(sprintf(
            'Cannot %s the system theme_presets row "%s" — use ThemePreset::allowSystemMutation() from the seeder or tests.',
            $action,
            $rowId,
        )))->withContext([
            'model'  => 'ThemePreset',
            'action' => $action,
            'row_id' => $rowId,
        ]);
    }
}
