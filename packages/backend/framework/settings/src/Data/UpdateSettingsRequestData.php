<?php

declare(strict_types=1);

namespace Stackra\Settings\Data;

use Stackra\Settings\Contracts\SettingsRegistryInterface;
use Illuminate\Support\Facades\Route;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Support\Validation\ValidationContext;

/**
 * Validated request payload for
 * `PUT /api/v1/settings/{group}`.
 *
 * The registry drives validation — the field set + validation
 * rules are looked up per-group at runtime from the resolved
 * `#[SettingField]` declarations. Rules are surfaced through
 * `rules()` rather than property-level attributes because the
 * shape varies per group and is not knowable at DTO-class compile
 * time.
 *
 * The DTO stores every field as an untyped `values` array —
 * partial updates are legal, so any subset of the group's fields
 * may be present. Fields not passed are ignored.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
final class UpdateSettingsRequestData extends Data
{
    /**
     * @param  array<string, mixed>  $values  The partial set of field values from the request body.
     */
    public function __construct(
        public array $values,
    ) {}

    /**
     * Runtime validation rules — resolves the group from the
     * current route + looks up the registered `#[SettingField]`
     * declarations to build the rule set.
     *
     * Only fields present in the request body are validated
     * (partial update semantics).
     *
     * @param  ValidationContext  $context  Spatie's validation context — carries the raw payload.
     * @return array<string, array<int, string>>
     */
    public static function rules(ValidationContext $context): array
    {
        $group = self::currentGroup();

        if ($group === null) {
            return [];
        }

        /** @var SettingsRegistryInterface $registry */
        $registry = app(SettingsRegistryInterface::class);

        $definition = $registry->get($group);

        if ($definition === null) {
            return [];
        }

        /** @var array<string, mixed> $payload */
        $payload = $context->payload;

        /** @var array<string, mixed> $incoming */
        $incoming = is_array($payload['values'] ?? null) ? $payload['values'] : $payload;

        $rules = [];

        foreach ($definition->fields as $field) {
            if (array_key_exists($field->key, $incoming) && $field->validation !== []) {
                // Prefix every rule key with `values.` because the
                // wire body is nested under the `values` array.
                $rules["values.{$field->key}"] = $field->validation;
            }
        }

        return $rules;
    }

    /**
     * Resolve the `{group}` segment from the current route.
     *
     * Returns `null` when no route is active — this happens in
     * unit-tests that invoke `rules()` outside a request context.
     */
    private static function currentGroup(): ?string
    {
        $route = Route::current();

        if ($route === null) {
            return null;
        }

        /** @var mixed $group */
        $group = $route->parameter('group');

        return is_string($group) && $group !== '' ? $group : null;
    }
}
