<?php

declare(strict_types=1);

namespace Academorix\Transfer\Contracts\Services;

use Academorix\ServiceProvider\Attributes\HydratesFrom;
use Academorix\Transfer\Attributes\Exportable;
use Academorix\Transfer\Attributes\Importable;
use Academorix\Transfer\Attributes\SampleData;
use Academorix\Transfer\Services\EntityRegistry;
use Illuminate\Container\Attributes\Bind;

/**
 * Registry of every model class carrying `#[Importable]`,
 * `#[Exportable]`, or `#[SampleData]` — the compile-time capability
 * manifest the frontend renders on the import / export picker
 * screen.
 *
 * Hydrated at boot by the framework's generic
 * {@see \Academorix\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 * via the `#[HydratesFrom]` attributes on {@see register()}.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Bind(EntityRegistry::class)]
interface EntityRegistryInterface
{
    /**
     * Register a model class with the entity registry. Idempotent —
     * repeated registrations for the same `(className, attribute)`
     * pair are no-ops.
     *
     * `#[HydratesFrom]` — the framework scans every class carrying
     * `#[Importable]` / `#[Exportable]` / `#[SampleData]` at boot
     * and calls this method with `(className, attributeInstance)`.
     * The attribute is `IS_REPEATABLE` (a model may participate in
     * all three); each hit is dispatched separately.
     *
     * @param  class-string                            $className  FQCN of the model.
     * @param  Importable|Exportable|SampleData        $attribute  The discovered attribute instance.
     */
    #[HydratesFrom(Importable::class, priority: 120)]
    #[HydratesFrom(Exportable::class, priority: 120)]
    #[HydratesFrom(SampleData::class, priority: 120)]
    public function register(string $className, Importable|Exportable|SampleData $attribute): void;

    /**
     * Every entity key registered on the importable path, in
     * registration order.
     *
     * @return list<string>
     */
    public function importableKeys(): array;

    /**
     * Every entity key registered on the exportable path, in
     * registration order.
     *
     * @return list<string>
     */
    public function exportableKeys(): array;

    /**
     * Every entity key registered on the sample-data path, in
     * registration order.
     *
     * @return list<string>
     */
    public function sampleableKeys(): array;

    /**
     * The model class registered for an entity key on the importable
     * path, or `null` when not registered.
     *
     * @return class-string|null
     */
    public function importableModel(string $entityKey): ?string;

    /**
     * The model class registered for an entity key on the exportable
     * path, or `null` when not registered.
     *
     * @return class-string|null
     */
    public function exportableModel(string $entityKey): ?string;

    /**
     * Reset the registry — used by tests between fixtures.
     */
    public function clear(): void;
}
