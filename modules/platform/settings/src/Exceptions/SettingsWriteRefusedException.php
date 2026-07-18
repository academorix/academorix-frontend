<?php

declare(strict_types=1);

namespace Academorix\Settings\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a write is refused — validation failed, the field is
 * locked at a higher scope, the caller lacks the permission, or the
 * platform kill-switch for settings writes is on.
 *
 * The refused reason is carried on the exception context so the
 * response envelope can surface it verbatim without leaking
 * implementation detail.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
final class SettingsWriteRefusedException extends AcademorixException
{
    public const CODE = 'settings.write_refused';

    public const TRANSLATION_KEY = 'settings::errors.write_refused';

    /**
     * Convenience factory carrying the refused key + reason.
     *
     * @param  string  $key     The field slug that was written.
     * @param  string  $reason  One of `validation_failed` / `locked` /
     *                          `permission_denied` / `sensitive_reveal_denied` /
     *                          `writes_kill_switched`.
     */
    public static function for(string $key, string $reason): self
    {
        $ex = new self(\sprintf('Write to setting "%s" refused: %s.', $key, $reason));
        $ex->context = [
            'key'    => $key,
            'reason' => $reason,
        ];

        return $ex;
    }

    /** @var array<string, mixed> */
    public array $context = [];
}
