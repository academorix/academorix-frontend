<?php

declare(strict_types=1);

namespace Stackra\Webhook\Contracts\Services;

use Stackra\ServiceProvider\Attributes\HydratesFrom;
use Stackra\Webhook\Attributes\AsWebhookEvent;
use Stackra\Webhook\Services\WebhookRegistry;
use Illuminate\Container\Attributes\Bind;

/**
 * Attribute-discovered registry of every `#[AsWebhookEvent]`-marked
 * class the app boots with.
 *
 * Hydrated at boot by the framework's generic
 * {@see \Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 * pump via the {@see HydratesFrom} attribute on {@see register()}.
 * Consumed by:
 *
 *   - the tenant admin UI when picking events to subscribe to,
 *   - the dispatcher when broadcasting to matching subscriptions,
 *   - the `webhook:test` command when firing test events.
 *
 * `#[Bind(WebhookRegistry::class)]` — Pattern A per
 * `.kiro/steering/php-attributes.md` §"Bind vs Overrides". Consumers
 * depend on this interface (never the concrete class) so tests can
 * bind a fake.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Bind(WebhookRegistry::class)]
interface WebhookRegistryInterface
{
    /**
     * Register a webhook event.
     *
     * `#[HydratesFrom(AsWebhookEvent::class)]` — the framework scans
     * every class carrying `#[AsWebhookEvent]` at boot and calls this
     * method with `(className, attributeInstance)`. The concrete
     * implementation extracts `name` / `version` / `description`
     * from the attribute and stores the row keyed by event name.
     *
     * @param  class-string  $className  FQCN of the event / payload class.
     * @param  AsWebhookEvent  $attribute  The discovered attribute instance.
     */
    #[HydratesFrom(AsWebhookEvent::class)]
    public function register(string $className, AsWebhookEvent $attribute): void;

    /**
     * Every registered event, keyed by name.
     *
     * @return array<string, array{class: string, version: string, description: string}>
     */
    public function all(): array;

    /**
     * Whether an event is registered.
     */
    public function has(string $eventName): bool;
}
