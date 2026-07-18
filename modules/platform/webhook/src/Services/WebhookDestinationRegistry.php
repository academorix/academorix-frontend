<?php

declare(strict_types=1);

namespace Academorix\Webhook\Services;

use Academorix\Webhook\Attributes\AsWebhookDestination;
use Academorix\Webhook\Contracts\Services\WebhookDestinationInterface;
use Academorix\Webhook\Contracts\Services\WebhookDestinationRegistryInterface;
use Academorix\Webhook\Exceptions\InvalidDestinationConfigException;
use Illuminate\Container\Attributes\Singleton;
use Illuminate\Contracts\Container\Container;

/**
 * In-memory registry of every `#[AsWebhookDestination]`-marked driver.
 *
 * Hydrated at boot by the framework's generic hydration pump
 * ({@see \Academorix\ServiceProvider\Bootstrappers\HydrationBootstrapper})
 * via the `#[HydratesFrom]` declaration on
 * {@see WebhookDestinationRegistryInterface::register()}. Consumed by
 * the sender + the tenant admin UI (which options to display when
 * creating a subscription).
 *
 * Drivers themselves are resolved through the container so their
 * dependencies (`WebhookSignerInterface`, HTTP client, ...) come in
 * cleanly. `#[Singleton]` on the registry — driver instances are
 * scoped per resolution. The interface declares the container binding
 * via `#[Bind(WebhookDestinationRegistry::class)]` (Pattern A per
 * `.kiro/steering/php-attributes.md`), so this concrete carries only
 * its lifetime attribute.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Singleton]
final class WebhookDestinationRegistry implements WebhookDestinationRegistryInterface
{
    /**
     * Driver catalogue keyed by name.
     *
     * @var array<string, array{class: string, supports_batching: bool, required_config: list<string>}>
     */
    private array $drivers = [];

    /**
     * @param  Container  $container  Resolves discovered driver
     *                                classes on {@see resolve()} so
     *                                their own DI dependencies come
     *                                in cleanly.
     */
    public function __construct(private readonly Container $container)
    {
    }

    /**
     * {@inheritDoc}
     *
     * Idempotent — the second registration of the same driver name
     * overwrites the first with the same value (deterministic under
     * `#[HydratesFrom]`). Field extraction happens here so the
     * framework's hydration pump doesn't need to know the domain
     * shape of the driver catalogue.
     */
    public function register(string $className, AsWebhookDestination $attribute): void
    {
        $this->drivers[$attribute->name] = [
            'class'             => $className,
            'supports_batching' => $attribute->supportsBatching,
            'required_config'   => \array_values($attribute->requiresConfig),
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function resolve(string $key): WebhookDestinationInterface
    {
        if (! isset($this->drivers[$key])) {
            throw new InvalidDestinationConfigException(\sprintf(
                'Unknown webhook destination driver "%s".',
                $key,
            ));
        }

        $class = $this->drivers[$key]['class'];

        /** @var WebhookDestinationInterface $driver */
        $driver = $this->container->make($class);

        return $driver;
    }

    /**
     * {@inheritDoc}
     */
    public function all(): array
    {
        return $this->drivers;
    }
}
