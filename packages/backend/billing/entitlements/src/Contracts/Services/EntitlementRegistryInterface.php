<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Contracts\Services;

use Stackra\Entitlements\Attributes\ConsumesEntitlement;
use Stackra\Entitlements\Enums\EntitlementKind;
use Stackra\Entitlements\Enums\EntitlementPeriod;
use Stackra\Entitlements\Services\EntitlementRegistry;
use Stackra\ServiceProvider\Attributes\HydratesFrom;
use Illuminate\Container\Attributes\Bind;

/**
 * In-memory registry of every `#[ConsumesEntitlement]`-declared key.
 *
 * Hydrated at boot by the framework's generic
 * {@see \Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 * pump via the {@see HydratesFrom} attribute on {@see register()}.
 * Consumers query the registry for the shipped default value + kind
 * when provisioning a new tenant.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Bind(EntitlementRegistry::class)]
interface EntitlementRegistryInterface
{
    /**
     * Register a declared entitlement key.
     *
     * `#[HydratesFrom(ConsumesEntitlement::class)]` — the framework
     * scans every class carrying `#[ConsumesEntitlement]` at boot and
     * calls this method with `(className, attributeInstance)`. Field
     * extraction (`key`, `kind`, `defaultValue`, `period`) happens
     * inside the concrete registry so the hydration cache replay
     * feeds the same shape as the live scan.
     *
     * @param  class-string       $className  FQCN of the consuming class.
     * @param  ConsumesEntitlement  $attribute  The discovered
     *   attribute instance — carries the key + kind + default value
     *   + optional reset period.
     */
    #[HydratesFrom(ConsumesEntitlement::class)]
    public function register(string $className, ConsumesEntitlement $attribute): void;

    /**
     * Every registered key.
     *
     * @return list<string>
     */
    public function keys(): array;

    /**
     * Registered shape (kind + default value + period) for one key.
     * Returns null when `$key` was never registered.
     *
     * @return array{kind: EntitlementKind, value: array<string, mixed>, period: EntitlementPeriod|null}|null
     */
    public function defaultsFor(string $key): ?array;

    /**
     * Whether the key was registered.
     */
    public function has(string $key): bool;
}
