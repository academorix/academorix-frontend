<?php

declare(strict_types=1);

namespace Academorix\Notifications\Sms\Contracts\Services;

use Academorix\Notifications\Sms\Attributes\AsSmsProvider;
use Academorix\Notifications\Sms\Services\SmsOptOutRegistry;
use Academorix\ServiceProvider\Attributes\HydratesFrom;
use Illuminate\Container\Attributes\Bind;

/**
 * Attribute-discovered registry of {@see AsSmsProvider} driver classes.
 *
 * Hydrated at boot by the framework's generic
 * {@see \Academorix\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 * pump via the {@see HydratesFrom} attribute on {@see register()}.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[Bind(SmsOptOutRegistry::class)]
interface SmsOptOutRegistryInterface
{
    /**
     * Register a discovered SMS provider class.
     *
     * `#[HydratesFrom(AsSmsProvider::class)]` — the framework scans every
     * class carrying `#[AsSmsProvider]` at boot and calls this method with
     * `(className, attributeInstance)`.
     *
     * @param  class-string   $className  FQCN of the driver.
     * @param  AsSmsProvider  $attribute  The discovered attribute instance.
     */
    #[HydratesFrom(AsSmsProvider::class)]
    public function register(string $className, AsSmsProvider $attribute): void;

    /**
     * Whether a driver is registered.
     */
    public function has(string $name): bool;

    /**
     * Every registered driver, keyed by name.
     *
     * @return array<string, array{class: class-string, supports_inbound: bool, supports_cost: bool}>
     */
    public function all(): array;

    /**
     * Every registered driver name.
     *
     * @return list<string>
     */
    public function names(): array;
}
