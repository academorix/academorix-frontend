<?php

/**
 * @file packages/events/src/Support/BroadcastConfigurator.php
 *
 * @description
 * Runtime resolver that turns discovered
 * {@see BroadcastMetadata} entries into the values the framework
 * expects when it calls an event's `broadcastOn()`,
 * `broadcastAs()`, and `broadcastQueue()` methods.
 *
 * ## What it replaces
 *
 * Without this configurator, every event class shipped by every
 * package would need three boilerplate methods:
 *
 *     public function broadcastOn(): array   { return [...]; }
 *     public function broadcastAs(): string  { return '...'; }
 *     public function broadcastQueue(): string { return '...'; }
 *
 * Instead, packages declare the same information via attributes on
 * the event class (see {@see \Stackra\Events\Attributes\Broadcastable},
 * {@see \Stackra\Events\Attributes\BroadcastOn},
 * {@see \Stackra\Events\Attributes\BroadcastAs},
 * {@see \Stackra\Events\Attributes\BroadcastQueue}) and delegate
 * the runtime resolution to this class.
 *
 * ## Wiring pattern
 *
 * The service provider populates the configurator with the
 * {@see BroadcastMetadata} map at boot and binds it as a singleton.
 * Event authors then either:
 *
 *   1. Compose the shipped `HasAttributeBroadcasting` trait (or an
 *      equivalent) that delegates `broadcastOn()` etc. to this
 *      resolver, OR
 *   2. Query the configurator directly from a bespoke `ShouldBroadcast`
 *      implementation.
 *
 * ## Channel resolution
 *
 * Each entry in `#[BroadcastOn]` is either:
 *
 *   - A **channel-factory class-string** — resolved via `new
 *     $class($event)`.
 *   - A **plain channel name** — wrapped in
 *     `Illuminate\Broadcasting\PrivateChannel`,
 *     `Illuminate\Broadcasting\PresenceChannel`, or
 *     `Illuminate\Broadcasting\Channel` per the effective channel
 *     type (from `#[Broadcastable(channelType: ...)]`, falling back
 *     to the `events.broadcast.default_channel_type` config value).
 *   - A **placeholder template** (contains `{...}`) — interpolated
 *     against the event instance before being wrapped as above.
 *     Tokens support one level of property navigation, e.g.
 *     `{order->id}` reads `$event->order->id`.
 *
 * ## Octane safety
 *
 * State is populated once at boot from immutable attribute metadata
 * and never mutated at request time. Safe as a singleton.
 */

declare(strict_types=1);

namespace Stackra\Events\Support;

use Stackra\Events\Attributes\Broadcastable;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Singleton;

/**
 * Runtime resolver for `#[Broadcastable]` metadata.
 *
 * Bound as `#[Singleton]` per ADR 0006 — the metadata map is
 * populated once at boot from immutable attribute inputs and
 * never mutated afterward, so sharing across the worker's
 * lifetime is safe.
 *
 * The default channel type is read via `#[Config]` on the
 * constructor and normalised to a legal `Broadcastable::CHANNEL_TYPE_*`
 * value in the constructor body — an invalid config value falls
 * back to `private` (the safest default) rather than propagating
 * a garbage string through the broadcasting pipeline.
 */
#[Singleton]
final class BroadcastConfigurator
{
    /**
     * Metadata keyed by event class-string. Populated via
     * {@see self::register()} and never mutated after boot.
     *
     * @var array<class-string, BroadcastMetadata>
     */
    private array $metadata = [];

    /**
     * Effective default channel type — always one of
     * `private` / `public` / `presence`. Non-conforming config
     * values are silently coerced to `private` in the constructor.
     *
     * @var 'private'|'public'|'presence'
     */
    private readonly string $defaultChannelType;

    /**
     * @param  string  $configuredChannelType
     *   Raw value from `events.broadcast.default_channel_type`.
     *   Normalised in the constructor — anything other than
     *   `public`, `presence`, or `private` falls back to `private`.
     */
    public function __construct(
        #[Config('events.broadcast.default_channel_type', Broadcastable::CHANNEL_TYPE_PRIVATE)]
        string $configuredChannelType = Broadcastable::CHANNEL_TYPE_PRIVATE,
    ) {
        // Normalise to a known channel type — any invalid config
        // value falls back to `private` (the safest default)
        // rather than propagating a garbage string through the
        // broadcasting pipeline.
        $this->defaultChannelType = match ($configuredChannelType) {
            Broadcastable::CHANNEL_TYPE_PUBLIC,
            Broadcastable::CHANNEL_TYPE_PRESENCE,
            Broadcastable::CHANNEL_TYPE_PRIVATE => $configuredChannelType,
            default => Broadcastable::CHANNEL_TYPE_PRIVATE,
        };
    }

    /**
     * Register a {@see BroadcastMetadata} entry. Called once per
     * broadcast-annotated event class by the service provider at
     * boot. Later calls with the same event class overwrite the
     * previous entry — deliberate, so tests can replace metadata
     * between assertions.
     */
    public function register(BroadcastMetadata $metadata): void
    {
        $this->metadata[$metadata->eventClass] = $metadata;
    }

    /**
     * Bulk-register every metadata entry from a discovery manifest.
     *
     * @param  array<class-string, BroadcastMetadata>  $metadata
     */
    public function registerAll(array $metadata): void
    {
        foreach ($metadata as $entry) {
            $this->register($entry);
        }
    }

    /**
     * Whether the given event class (or instance) carries any
     * discovered broadcasting metadata — i.e. has a `#[Broadcastable]`
     * attribute in its source declaration.
     *
     * @param  class-string|object  $eventOrClass
     */
    public function isBroadcastable(string|object $eventOrClass): bool
    {
        return array_key_exists($this->resolveClass($eventOrClass), $this->metadata);
    }

    /**
     * Resolve the metadata for an event class, or `null` when the
     * class was never registered.
     *
     * @param  class-string|object  $eventOrClass
     */
    public function metadataFor(string|object $eventOrClass): ?BroadcastMetadata
    {
        return $this->metadata[$this->resolveClass($eventOrClass)] ?? null;
    }

    /**
     * Resolve the channels an event broadcasts on. Handles all three
     * entry shapes: channel-factory class-string, placeholder
     * template, and plain channel name.
     *
     * @return list<Channel>
     */
    public function channelsFor(object $event): array
    {
        $meta = $this->metadataFor($event);
        if ($meta === null) {
            return [];
        }

        $type = $meta->channelType ?? $this->defaultChannelType;

        $out = [];
        foreach ($meta->channels as $entry) {
            $out[] = $this->buildChannel($entry, $type, $event);
        }

        return $out;
    }

    /**
     * Resolve the broadcast name (used as the event's wire-name)
     * for the given event. Falls back to `null` — which mirrors the
     * framework's own default of using the FQCN.
     *
     * @param  class-string|object  $eventOrClass
     */
    public function broadcastNameFor(string|object $eventOrClass): ?string
    {
        return $this->metadataFor($eventOrClass)?->broadcastAs;
    }

    /**
     * Resolve the broadcast queue for the given event, or `null` to
     * defer to the framework default.
     *
     * @param  class-string|object  $eventOrClass
     */
    public function broadcastQueueFor(string|object $eventOrClass): ?string
    {
        return $this->metadataFor($eventOrClass)?->queue;
    }

    /**
     * Turn a single channel entry into a concrete
     * {@see Channel} instance. Factory class-strings win first;
     * plain strings fall through to placeholder interpolation +
     * channel-type wrapping.
     */
    private function buildChannel(string $entry, string $type, object $event): Channel
    {
        // Factory class-string — e.g. `MyCustomChannel::class`. The
        // factory subclass is expected to accept the event (or
        // relevant model) in its constructor and produce the
        // channel name itself.
        if (class_exists($entry) && is_subclass_of($entry, Channel::class)) {
            /** @var Channel $channel */
            $channel = new $entry($event);

            return $channel;
        }

        $name = $this->interpolate($entry, $event);

        return match ($type) {
            Broadcastable::CHANNEL_TYPE_PUBLIC => new Channel($name),
            Broadcastable::CHANNEL_TYPE_PRESENCE => new PresenceChannel($name),
            default => new PrivateChannel($name),
        };
    }

    /**
     * Replace `{property}` and `{property->property}` tokens in a
     * channel name template with values pulled off the event
     * instance. A token that cannot be resolved is left in place
     * — the resulting invalid channel name surfaces the mistake
     * loudly at broadcast time.
     */
    private function interpolate(string $template, object $event): string
    {
        if (! str_contains($template, '{')) {
            return $template;
        }

        return (string) preg_replace_callback(
            '/\{([^}]+)\}/',
            static function (array $matches) use ($event): string {
                $path = trim($matches[1]);
                $current = $event;

                foreach (explode('->', $path) as $segment) {
                    if (! is_object($current) || ! property_exists($current, $segment)) {
                        return $matches[0];
                    }

                    /** @var mixed $next */
                    $next = $current->{$segment};

                    if (is_scalar($next) || $next === null) {
                        $current = $next === null ? '' : (string) $next;

                        continue;
                    }

                    $current = $next;
                }

                return is_scalar($current) ? (string) $current : $matches[0];
            },
            $template,
        );
    }

    /**
     * Normalise the accepted `class-string|object` shape into the
     * pure class-string used as the metadata map key.
     *
     * @param  class-string|object  $eventOrClass
     * @return class-string
     */
    private function resolveClass(string|object $eventOrClass): string
    {
        return is_object($eventOrClass) ? $eventOrClass::class : $eventOrClass;
    }
}
