<?php

declare(strict_types=1);

namespace Stackra\Webhook\Contracts\Registry;

use Stackra\ServiceProvider\Attributes\HydratesFrom;
use Stackra\Webhook\Attributes\AsWebhookDestination;
use Stackra\Webhook\Registry\WebhookDestinationRegistry;
use Illuminate\Container\Attributes\Bind;

/**
 * Attribute-discovered registry of destination drivers.
 *
 * Hydrated at boot by the framework's generic
 * {@see \Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 * pump via the {@see HydratesFrom} attribute on {@see register()}.
 * Consumers pick a destination key when creating a subscription; the
 * sender resolves the key to the concrete driver on dispatch.
 *
 * `#[Bind(WebhookDestinationRegistry::class)]` — Pattern A per
 * `.kiro/steering/php-attributes.md` §"Bind vs Overrides". Consumers
 * depend on this interface (never the concrete class) so tests can
 * bind a fake.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Bind(WebhookDestinationRegistry::class)]
interface WebhookDestinationRegistryInterface
{
    /**
     * Register a destination driver.
     *
     * `#[HydratesFrom(AsWebhookDestination::class)]` — the framework
     * scans every class carrying `#[AsWebhookDestination]` at boot
     * and calls this method with `(className, attributeInstance)`.
     * The concrete implementation extracts `name` /
     * `supportsBatching` / `requiresConfig` from the attribute and
     * stores the row keyed by driver name.
     *
     * @param  class-string  $className  FQCN of the {@see WebhookDestinationInterface} implementation.
     * @param  AsWebhookDestination  $attribute  The discovered attribute instance.
     */
    #[HydratesFrom(AsWebhookDestination::class)]
    public function register(string $className, AsWebhookDestination $attribute): void;

    /**
     * Resolve a destination key to its driver instance.
     */
    public function resolve(string $key): WebhookDestinationInterface;

    /**
     * Every registered driver, keyed by name.
     *
     * @return array<string, array{class: string, supports_batching: bool, required_config: list<string>}>
     */
    public function all(): array;
}
