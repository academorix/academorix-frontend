<?php

declare(strict_types=1);

namespace Academorix\Audit\Contracts\Services;

use Academorix\Audit\Attributes\Auditable;
use Academorix\Audit\Services\AuditRegistry;
use Academorix\ServiceProvider\Attributes\HydratesFrom;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Singleton;

/**
 * Runtime registry of every model carrying `#[Auditable]` plus its
 * declared encrypt-field list.
 *
 * Hydrated at boot by the framework's generic
 * {@see \Academorix\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 * pump via the {@see HydratesFrom} attribute on {@see register()}.
 * The {@see \Academorix\Audit\Casts\EncryptedAuditValueCast} queries
 * the registry at cast time to decide whether a field's value should
 * be routed through the KMS cipher.
 *
 * Bound `#[Singleton]` — the registry is a stateless catalogue that
 * doesn't vary per-request; safe to share across the worker pool.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[Bind(AuditRegistry::class)]
#[Singleton]
interface AuditRegistryInterface
{
    /**
     * Register a class + its encrypt-field list.
     *
     * `#[HydratesFrom(Auditable::class)]` — the framework scans every
     * class carrying `#[Auditable]` at boot and calls this method
     * with `(className, attributeInstance)`. Field extraction happens
     * inside the concrete registry so the hydration cache replay
     * feeds the same shape as the live scan.
     *
     * @param  class-string  $className  FQCN of a model carrying
     *   `#[Auditable]`.
     * @param  Auditable  $attribute  The discovered attribute
     *   instance — carries `encryptFields` + `chainEnabled`.
     */
    #[HydratesFrom(Auditable::class)]
    public function register(string $className, Auditable $attribute): void;

    /**
     * Return the encrypt-field list for a model.
     *
     * Returns an empty list when the model isn't registered — the
     * cast treats that as "no encryption for this class", which
     * matches the pre-registration default.
     *
     * @param  class-string  $className  FQCN of the model.
     * @return list<string>              Field names to encrypt.
     */
    public function encryptedFieldsFor(string $className): array;

    /**
     * Return every registered class with its encrypt-field list.
     *
     * Consumed by the `audit:describe` console command to render the
     * registry contents as a table.
     *
     * @return array<class-string, list<string>>
     */
    public function all(): array;
}
