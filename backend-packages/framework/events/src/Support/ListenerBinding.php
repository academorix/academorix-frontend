<?php

/**
 * @file packages/events/src/Support/ListenerBinding.php
 *
 * @description
 * Immutable value object that captures everything the events package
 * knows about a single listener registration derived from
 * {@see \Academorix\Events\Attributes\OnEvent} or
 * {@see \Academorix\Events\Attributes\ListensFor} attributes.
 *
 * Produced by {@see EventDiscovery} and consumed by
 * {@see \Academorix\Events\Providers\EventsServiceProvider} which
 * translates each binding into an
 * `Illuminate\Contracts\Events\Dispatcher::listen()` call at boot.
 *
 * Keeping the binding as a plain DTO decouples the discovery step
 * from the dispatcher wiring — the exact same manifest can be
 * serialised to `bootstrap/cache/events.php` and reloaded on the
 * next boot without re-scanning attributes.
 */

declare(strict_types=1);

namespace Academorix\Events\Support;

final class ListenerBinding
{
    /**
     * @param  class-string  $eventClass    Fully-qualified event class this listener responds to.
     * @param  class-string  $listenerClass Fully-qualified listener class the dispatcher instantiates.
     * @param  string        $method        Method on the listener class the dispatcher invokes with
     *                                       the event as its sole argument. Defaults to `handle` for
     *                                       class-level `#[OnEvent]` registrations; carries the
     *                                       explicit method name for `#[ListensFor]` registrations.
     * @param  int           $priority      Dispatcher priority — higher fires earlier. Passed through
     *                                       verbatim to `Dispatcher::listen()`.
     * @param  bool          $queued        When true, the registration is wrapped so the listener
     *                                       runs on the queue. The provider handles the wrapping
     *                                       (either via `ShouldQueue` marker or a queued closure).
     * @param  bool          $afterCommit   When true, the registration only fires after the
     *                                       surrounding database transaction commits. When both
     *                                       `queued` and `afterCommit` are true, the queued job is
     *                                       dispatched after commit.
     */
    public function __construct(
        public readonly string $eventClass,
        public readonly string $listenerClass,
        public readonly string $method,
        public readonly int $priority,
        public readonly bool $queued,
        public readonly bool $afterCommit,
    ) {}

    /**
     * Serialise the binding to a plain array suitable for
     * `var_export()` into `bootstrap/cache/events.php`.
     *
     * @return array{
     *   eventClass: class-string,
     *   listenerClass: class-string,
     *   method: string,
     *   priority: int,
     *   queued: bool,
     *   afterCommit: bool,
     * }
     */
    public function toArray(): array
    {
        return [
            'eventClass' => $this->eventClass,
            'listenerClass' => $this->listenerClass,
            'method' => $this->method,
            'priority' => $this->priority,
            'queued' => $this->queued,
            'afterCommit' => $this->afterCommit,
        ];
    }

    /**
     * Rehydrate a binding from the array shape produced by
     * {@see self::toArray()}.
     *
     * @param  array{
     *   eventClass: class-string,
     *   listenerClass: class-string,
     *   method: string,
     *   priority: int,
     *   queued: bool,
     *   afterCommit: bool,
     * }  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            eventClass: $data['eventClass'],
            listenerClass: $data['listenerClass'],
            method: $data['method'],
            priority: (int) $data['priority'],
            queued: (bool) $data['queued'],
            afterCommit: (bool) $data['afterCommit'],
        );
    }
}
