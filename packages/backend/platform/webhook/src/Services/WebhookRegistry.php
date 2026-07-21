<?php

declare(strict_types=1);

namespace Stackra\Webhook\Services;

use Stackra\Webhook\Attributes\AsWebhookEvent;
use Stackra\Webhook\Contracts\Services\WebhookRegistryInterface;
use Illuminate\Container\Attributes\Singleton;

/**
 * In-memory registry of every `#[AsWebhookEvent]`-marked class.
 *
 * Hydrated at boot by the framework's generic hydration pump
 * ({@see \Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper})
 * via the `#[HydratesFrom]` declaration on
 * {@see WebhookRegistryInterface::register()}. Consumed by the
 * dispatcher, the tenant admin UI, and the `webhook:test` command.
 *
 * `#[Singleton]` — the catalogue is process-lifetime and stateless
 * per-request (the write path is boot-time only). The interface
 * declares the container binding via `#[Bind(WebhookRegistry::class)]`
 * (Pattern A per `.kiro/steering/php-attributes.md`), so this
 * concrete carries only its lifetime attribute.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Singleton]
final class WebhookRegistry implements WebhookRegistryInterface
{
    /**
     * Event catalogue keyed by event name.
     *
     * @var array<string, array{class: string, version: string, description: string}>
     */
    private array $events = [];

    /**
     * {@inheritDoc}
     *
     * Idempotent — the second registration of the same event name
     * overwrites the first with the same value (deterministic under
     * `#[HydratesFrom]`). Field extraction happens here so the
     * framework's hydration pump doesn't need to know the domain
     * shape of the event catalogue.
     */
    public function register(string $className, AsWebhookEvent $attribute): void
    {
        $this->events[$attribute->name] = [
            'class'       => $className,
            'version'     => $attribute->version,
            'description' => $attribute->description,
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function all(): array
    {
        return $this->events;
    }

    /**
     * {@inheritDoc}
     */
    public function has(string $eventName): bool
    {
        return isset($this->events[$eventName]);
    }
}
