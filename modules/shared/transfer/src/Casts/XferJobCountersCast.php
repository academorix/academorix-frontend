<?php

declare(strict_types=1);

namespace Academorix\Transfer\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Eloquent cast for the JSONB `xfer_jobs.counters` column.
 *
 * Normalises the shape so consumers always see the six canonical
 * keys (`total`, `created`, `updated`, `skipped`, `failed`,
 * `deleted`) regardless of what the DB row stored.
 *
 * @implements CastsAttributes<array<string, int>, array<string, int>>
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class XferJobCountersCast implements CastsAttributes
{
    private const DEFAULT_KEYS = ['total', 'created', 'updated', 'skipped', 'failed', 'deleted'];

    /**
     * {@inheritDoc}
     *
     * @return array<string, int>
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): array
    {
        $decoded = \is_string($value) ? \json_decode($value, true) : $value;
        $decoded = \is_array($decoded) ? $decoded : [];

        $normalised = [];
        foreach (self::DEFAULT_KEYS as $bucket) {
            $normalised[$bucket] = (int) ($decoded[$bucket] ?? 0);
        }

        return $normalised;
    }

    /**
     * {@inheritDoc}
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): string
    {
        return (string) \json_encode(\is_array($value) ? $value : []);
    }
}
