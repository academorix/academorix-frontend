<?php

/**
 * @file packages/events/src/Attributes/OnEvent.php
 *
 * @description
 * Class-level, repeatable attribute that marks a class as a listener
 * for a specific event. Discovered by
 * {@see \Stackra\Events\Support\EventDiscovery} via
 * `olvlvl/composer-attribute-collector` at boot and registered with
 * Laravel's event dispatcher — so packages never have to maintain a
 * `EventServiceProvider::$listen` map.
 *
 * ## Semantics
 *
 *   - The bearing class handles `$event` via its `handle()` method
 *     (matching Laravel's listener convention).
 *   - `priority` is passed through to
 *     `Illuminate\Events\Dispatcher::listen()` — higher wins.
 *   - `queued` toggles queued-listener registration; when true, the
 *     listener is wrapped so the framework dispatches it via the
 *     queue even if the class does not implement `ShouldQueue`.
 *   - `afterCommit` when true wraps the listener so it fires only
 *     after the surrounding database transaction commits. Complements
 *     the class-level marker {@see AfterCommit}, which sets the same
 *     behaviour without requiring the flag on every attribute.
 *
 * ## Repeatable
 *
 * A single listener class may declare `#[OnEvent(A::class)]` and
 * `#[OnEvent(B::class)]` on the same class body — the scanner
 * registers one listener binding per attribute instance.
 *
 * @see \Stackra\Events\Attributes\ListensFor  For method-scoped
 *                                                  registrations with
 *                                                  an explicit `method`
 *                                                  name.
 */

declare(strict_types=1);

namespace Stackra\Events\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE)]
final class OnEvent
{
    /**
     * @param  class-string  $event        Fully-qualified event class this listener responds to.
     * @param  int           $priority     Dispatcher priority — higher fires earlier. Defaults to `0`,
     *                                     matching Laravel's default listen priority.
     * @param  bool          $queued       When true, the listener is registered to run on the queue.
     *                                     The scanner wraps registration so classes that don't already
     *                                     implement `Illuminate\Contracts\Queue\ShouldQueue` still land
     *                                     on the queue.
     * @param  bool          $afterCommit  When true, the dispatcher only fires the listener after the
     *                                     current database transaction commits. Combines cleanly with
     *                                     `#[AfterCommit]` on the class itself.
     */
    public function __construct(
        public readonly string $event,
        public readonly int $priority = 0,
        public readonly bool $queued = false,
        public readonly bool $afterCommit = false,
    ) {}
}
