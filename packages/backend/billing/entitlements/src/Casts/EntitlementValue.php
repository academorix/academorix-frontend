<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Casts;

use Academorix\Entitlements\Contracts\Data\EntitlementInterface;
use Academorix\Entitlements\Enums\EntitlementKind;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Schema-aware JSON cast for `entitlements.value`.
 *
 * Validates the payload shape matches the declared `kind` on the same
 * row. Slot + pool rows carry `{limit, used}`; boolean rows carry
 * `{enabled}`; unlimited rows carry `{}`.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 *
 * @implements CastsAttributes<array<string, mixed>, array<string, mixed>>
 */
final class EntitlementValue implements CastsAttributes
{
    /**
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): array
    {
        if ($value === null || $value === '') {
            return [];
        }

        /** @var array<string, mixed>|null $decoded */
        $decoded = \json_decode((string) $value, associative: true);

        return \is_array($decoded) ? $decoded : [];
    }

    /**
     * @param  array<string, mixed>|null  $value       Kind-dependent shape.
     * @param  array<string, mixed>       $attributes  Sibling column values (used to read the kind).
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        if (! \is_array($value)) {
            $value = [];
        }

        // Validate the shape against the declared kind on the same row.
        $kindRaw = $attributes[EntitlementInterface::ATTR_KIND] ?? null;
        $kind    = \is_string($kindRaw) ? EntitlementKind::tryFrom($kindRaw) : null;

        if ($kind !== null) {
            $value = $this->normalise($kind, $value);
        }

        $json = \json_encode($value, \JSON_UNESCAPED_UNICODE | \JSON_UNESCAPED_SLASHES);

        return $json === false ? null : $json;
    }

    /**
     * Fill in the canonical keys for the declared kind. Never loses
     * caller-supplied values — only adds defaults for missing keys.
     *
     * @param  array<string, mixed>  $value
     * @return array<string, mixed>
     */
    private function normalise(EntitlementKind $kind, array $value): array
    {
        return match ($kind) {
            EntitlementKind::Slot, EntitlementKind::Pool => [
                'limit' => $value['limit'] ?? 0,
                'used'  => $value['used'] ?? 0,
                ...$value,
            ],
            EntitlementKind::Boolean => [
                'enabled' => (bool) ($value['enabled'] ?? false),
                ...$value,
            ],
            EntitlementKind::Unlimited => $value,
        };
    }
}
