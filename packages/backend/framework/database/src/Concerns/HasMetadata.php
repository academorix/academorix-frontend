<?php

declare(strict_types=1);

namespace Stackra\Database\Concerns;

use Waad\Metadata\Traits\HasManyMetadata;

/**
 * Adds schema-less metadata to any model.
 *
 * Wraps waad/laravel-model-metadata's {@see HasManyMetadata} so the whole
 * codebase references one Foundation concern (decoupled from the vendor trait
 * and a single place to adjust behaviour). Metadata is stored in the central,
 * polymorphic `model_metadata` table — no per-table column is required, so this
 * concern is available to every model regardless of its schema.
 *
 * Usage:
 * ```php
 * $model->createMetadata(['tier' => 'gold', 'flags' => ['beta' => true]]);
 * $model->getMetadata();          // array of metadata rows
 * $model->searchMetadata('gold'); // value/partial match
 * ```
 *
 * Tenancy note: rows are reached via the owning model's relation, so metadata on
 * a tenant-owned model is implicitly scoped by that model. The `model_metadata`
 * table itself is central (not tenant-partitioned); do not query it directly
 * across tenants without constraining by the owner.
 */
trait HasMetadata
{
    use HasManyMetadata;
}
