<?php

declare(strict_types=1);

namespace Stackra\Transfer\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Eloquent cast for the compact lookup-by pointer used by
 * `#[ImportField(lookup: ...)]` — encodes a `field:table:column`
 * tuple onto a JSON column.
 *
 * @implements CastsAttributes<array{field: string, table: string, column: string}|null, array<string, string>|null>
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class LookupByCast implements CastsAttributes
{
    /**
     * {@inheritDoc}
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?array
    {
        if ($value === null || $value === '') {
            return null;
        }

        $decoded = \is_string($value) ? \json_decode($value, true) : $value;

        return \is_array($decoded) ? $decoded : null;
    }

    /**
     * {@inheritDoc}
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        return (string) \json_encode($value);
    }
}
