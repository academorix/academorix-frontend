<?php

declare(strict_types=1);

namespace Academorix\Invitations\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Cast for the polymorphic `inviter_type` column.
 *
 * Recognised inviter kinds:
 *
 *   - `user`             — an authenticated tenant user.
 *   - `service_account`  — a machine credential (SDK / integration).
 *   - `system`           — platform-initiated (Academorix ops).
 *
 * When the stored value is a fully-qualified class name (legacy
 * writes), fall back to the trailing segment lowercased so the JSON
 * envelope always renders the morph-map key. Reads normalise to
 * `system` when the column is null.
 *
 * @category Invitations
 *
 * @since    0.1.0
 *
 * @implements CastsAttributes<string, string|null>
 */
final class InvitationInviterCast implements CastsAttributes
{
    /**
     * Hydrate — normalise the stored value to a morph-map key.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): string
    {
        if ($value === null || $value === '') {
            return 'system';
        }

        $raw = (string) $value;

        // FQCN fallback — take the trailing segment lowercased.
        if (\str_contains($raw, '\\')) {
            $segment = (string) \substr($raw, (int) \strrpos($raw, '\\') + 1);

            return \strtolower($segment);
        }

        return $raw;
    }

    /**
     * Save — accept either a morph-map key or an FQCN and store the
     * canonical morph-map key.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return 'system';
        }

        $raw = (string) $value;
        if ($raw === '') {
            return 'system';
        }

        if (\str_contains($raw, '\\')) {
            $segment = (string) \substr($raw, (int) \strrpos($raw, '\\') + 1);

            return \strtolower($segment);
        }

        return $raw;
    }
}
