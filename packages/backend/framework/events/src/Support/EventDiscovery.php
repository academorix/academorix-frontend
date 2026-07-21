<?php

/**
 * @file packages/events/src/Support/EventDiscovery.php
 *
 * @description
 * Scanner that walks the unified {@see DiscoversAttributes} service
 * to produce a {@see DiscoveryManifest} — the map every package
 * needs so the framework's event dispatcher and broadcaster can
 * wire listeners and broadcasting metadata without any
 * `EventServiceProvider::$listen` boilerplate.
 *
 * ## Scanning strategy
 *
 *   1. `$discovery->forClass(OnEvent::class)` — every listener
 *      class carrying `#[OnEvent(Event::class)]`. Yields one
 *      target per attribute INSTANCE (the attribute is repeatable,
 *      so a single listener may show up multiple times).
 *
 *   2. `$discovery->forMethod(ListensFor::class)` — every method
 *      carrying `#[ListensFor(Event::class, method: 'foo')]`.
 *
 *   3. `$discovery->forClass(AfterCommit::class)` — the set of
 *      listener classes that opt every one of their attribute-
 *      derived listeners into after-commit semantics.
 *
 *   4. `$discovery->forClass(Broadcastable::class)` — the set of
 *      event classes that carry the broadcasting marker. For
 *      each, the scanner also collects
 *      {@see \Stackra\Events\Attributes\BroadcastOn},
 *      {@see \Stackra\Events\Attributes\BroadcastAs}, and
 *      {@see \Stackra\Events\Attributes\BroadcastQueue}.
 *
 * ## Zero-runtime-reflection design
 *
 * The scanner never calls `ReflectionClass` at request time — the
 * manifest is a hash-map lookup because `composer dump-autoload`
 * has already indexed every attribute usage under
 * `vendor/attributes.php` (via
 * {@see \Stackra\Foundation\Discovery\AttributeDiscovery}, our
 * shared wrapper over `olvlvl/composer-attribute-collector`).
 *
 * ## Testability
 *
 * The scanner accepts one dependency — the {@see DiscoversAttributes}
 * contract. Tests bind an in-memory implementation that returns
 * fixture target lists. See `tests/Unit/EventDiscoveryTest.php`
 * for the pattern.
 *
 * ## Octane safety
 *
 * The service holds no mutable state. `discover()` computes its
 * result from injected data and returns an immutable
 * {@see DiscoveryManifest}. Bind as a singleton — the input data
 * (attribute-collector manifest) is compile-time-immutable.
 */

declare(strict_types=1);

namespace Stackra\Events\Support;

use Stackra\Events\Attributes\AfterCommit;
use Stackra\Events\Attributes\Broadcastable;
use Stackra\Events\Attributes\BroadcastAs;
use Stackra\Events\Attributes\BroadcastOn;
use Stackra\Events\Attributes\BroadcastQueue;
use Stackra\Events\Attributes\ListensFor;
use Stackra\Events\Attributes\OnEvent;
use Stackra\Foundation\Contracts\DiscoversAttributes;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Singleton;

/**
 * Discover event listeners + broadcast metadata via the shared
 * attribute-discovery contract.
 *
 * Bound as `#[Singleton]` per ADR 0006 — the discovery pass is
 * pure over the composer-attribute-collector manifest so sharing
 * one instance across the worker's lifetime is safe. The two
 * scalar constructor parameters read from the `events.discovery.*`
 * config keys via `#[Config]`; the container snapshots the values
 * once at resolution time.
 *
 * @final
 */
#[Singleton]
final class EventDiscovery
{
    /**
     * @param  DiscoversAttributes  $discovery     Shared discovery service.
     *                                             Wraps `olvlvl/composer-attribute-collector`
     *                                             in production; test doubles bind an
     *                                             in-memory fixture.
     * @param  bool                 $cacheEnabled  When true, materialise the
     *                                             manifest to disk on first
     *                                             discovery + reload from disk
     *                                             on subsequent boots. Read
     *                                             from `events.discovery.cache`.
     * @param  string|null          $cachePath     Absolute path to the on-disk
     *                                             cache. Read from
     *                                             `events.discovery.cache_path`.
     *                                             `null` disables caching even
     *                                             when `$cacheEnabled` is true —
     *                                             non-Laravel test harnesses
     *                                             don't have a bootstrap-cache
     *                                             directory to write to.
     */
    public function __construct(
        private readonly DiscoversAttributes $discovery,
        #[Config('events.discovery.cache', true)]
        private readonly bool $cacheEnabled = false,
        #[Config('events.discovery.cache_path')]
        private readonly ?string $cachePath = null,
    ) {}

    /**
     * Discover every listener + broadcast declaration in the app.
     *
     * When the on-disk cache is enabled and a valid snapshot
     * exists, the manifest is loaded from disk (a `require` on the
     * exported PHP array). Otherwise the scanner walks the four
     * attribute sources and materialises a fresh
     * {@see DiscoveryManifest} — writing it to disk if caching is
     * enabled.
     */
    public function discover(): DiscoveryManifest
    {
        if ($this->cacheEnabled && $this->cachePath !== null && is_file($this->cachePath)) {
            /** @var array{
             *   listeners: list<array{
             *     eventClass: class-string,
             *     listenerClass: class-string,
             *     method: string,
             *     priority: int,
             *     queued: bool,
             *     afterCommit: bool,
             *   }>,
             *   broadcastMetadata: array<class-string, array{
             *     eventClass: class-string,
             *     channels: list<string>,
             *     channelType: string|null,
             *     broadcastAs: string|null,
             *     queue: string|null,
             *   }>,
             * } $cached */
            $cached = require $this->cachePath;

            return DiscoveryManifest::fromArray($cached);
        }

        $manifest = $this->scan();

        if ($this->cacheEnabled && $this->cachePath !== null) {
            $this->writeCache($manifest);
        }

        return $manifest;
    }

    /**
     * Rebuild the manifest from source, bypassing the on-disk
     * cache. Useful in dev workflows where the cache is on but
     * you want a one-off fresh scan.
     */
    public function scan(): DiscoveryManifest
    {
        $afterCommitClasses = $this->collectAfterCommitClasses();

        $listeners = [];

        // `#[OnEvent]` on the class body — the listener's `handle()`
        // receives the event.
        foreach ($this->discovery->forClass(OnEvent::class) as $target) {
            /** @var OnEvent $attribute */
            $attribute = $target->attribute;

            $listeners[] = new ListenerBinding(
                eventClass: $attribute->event,
                listenerClass: $target->className,
                method: 'handle',
                priority: $attribute->priority,
                queued: $attribute->queued,
                afterCommit: $attribute->afterCommit || isset($afterCommitClasses[$target->className]),
            );
        }

        // `#[ListensFor]` on a method — the specified method receives
        // the event (multi-method listeners).
        foreach ($this->discovery->forMethod(ListensFor::class) as $target) {
            /** @var ListensFor $attribute */
            $attribute = $target->attribute;

            $listeners[] = new ListenerBinding(
                eventClass: $attribute->event,
                listenerClass: $target->className,
                method: $target->methodName,
                priority: $attribute->priority,
                queued: $attribute->queued,
                afterCommit: $attribute->afterCommit || isset($afterCommitClasses[$target->className]),
            );
        }

        $broadcastMetadata = $this->collectBroadcastMetadata();

        return new DiscoveryManifest(
            listeners: array_values($listeners),
            broadcastMetadata: $broadcastMetadata,
        );
    }

    /**
     * Delete the on-disk cache file if present. Called via
     * `events:cache:clear` style hooks and by the provider when
     * cache invalidation is requested explicitly.
     */
    public function flushCache(): void
    {
        if ($this->cachePath !== null && is_file($this->cachePath)) {
            @unlink($this->cachePath);
        }
    }

    /**
     * Build the `class-string => true` set of listener classes
     * that carry the {@see AfterCommit} marker attribute. Used to
     * fold the class-level marker into per-attribute
     * `afterCommit` flags — a listener class with `#[AfterCommit]`
     * opts EVERY `#[OnEvent]` / `#[ListensFor]` on it into after-
     * commit semantics.
     *
     * @return array<class-string, true>
     */
    private function collectAfterCommitClasses(): array
    {
        $classes = [];
        foreach ($this->discovery->forClass(AfterCommit::class) as $target) {
            $classes[$target->className] = true;
        }

        return $classes;
    }

    /**
     * Aggregate every broadcasting attribute discovered in the
     * codebase into a `class-string => BroadcastMetadata` map,
     * keyed by the event class.
     *
     * @return array<class-string, BroadcastMetadata>
     */
    private function collectBroadcastMetadata(): array
    {
        /** @var array<class-string, Broadcastable> $broadcastables */
        $broadcastables = [];
        foreach ($this->discovery->forClass(Broadcastable::class) as $target) {
            /** @var Broadcastable $attribute */
            $attribute = $target->attribute;
            $broadcastables[$target->className] = $attribute;
        }

        if ($broadcastables === []) {
            return [];
        }

        /** @var array<class-string, list<string>> $channelsByClass */
        $channelsByClass = [];
        foreach ($this->discovery->forClass(BroadcastOn::class) as $target) {
            /** @var BroadcastOn $attribute */
            $attribute = $target->attribute;
            $channelsByClass[$target->className] = array_merge(
                $channelsByClass[$target->className] ?? [],
                $attribute->channels,
            );
        }

        /** @var array<class-string, string> $broadcastAsByClass */
        $broadcastAsByClass = [];
        foreach ($this->discovery->forClass(BroadcastAs::class) as $target) {
            /** @var BroadcastAs $attribute */
            $attribute = $target->attribute;
            $broadcastAsByClass[$target->className] = $attribute->name;
        }

        /** @var array<class-string, string> $broadcastQueueByClass */
        $broadcastQueueByClass = [];
        foreach ($this->discovery->forClass(BroadcastQueue::class) as $target) {
            /** @var BroadcastQueue $attribute */
            $attribute = $target->attribute;
            $broadcastQueueByClass[$target->className] = $attribute->name;
        }

        $out = [];
        foreach ($broadcastables as $eventClass => $marker) {
            $out[$eventClass] = new BroadcastMetadata(
                eventClass: $eventClass,
                channels: array_values($channelsByClass[$eventClass] ?? []),
                channelType: $marker->channelType,
                broadcastAs: $broadcastAsByClass[$eventClass] ?? null,
                // BroadcastQueue is more specific than the queue argument on Broadcastable.
                queue: $broadcastQueueByClass[$eventClass] ?? $marker->queue,
            );
        }

        return $out;
    }

    /**
     * Materialise the manifest to `bootstrap/cache/events.php`
     * as a `var_export()`ed PHP array. The file is loaded via
     * `require` on subsequent boots, which is faster than any
     * userland deserialisation.
     *
     * File-system errors are swallowed intentionally — cache
     * writing is a best-effort optimisation, never a hard
     * requirement. Any failure just means the next boot scans
     * afresh.
     */
    private function writeCache(DiscoveryManifest $manifest): void
    {
        if ($this->cachePath === null) {
            return;
        }

        $directory = dirname($this->cachePath);
        if (! is_dir($directory) && ! @mkdir($directory, 0o755, true) && ! is_dir($directory)) {
            return;
        }

        $exported = var_export($manifest->toArray(), true);
        $contents = "<?php\n\nreturn {$exported};\n";

        @file_put_contents($this->cachePath, $contents, LOCK_EX);
    }
}
