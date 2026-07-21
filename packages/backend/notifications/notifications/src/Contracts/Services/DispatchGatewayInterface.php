<?php

declare(strict_types=1);

namespace Stackra\Notifications\Contracts\Services;

use Stackra\Notifications\Models\Notification;
use Stackra\Notifications\Services\DefaultDispatchGateway;
use Stackra\Notifications\Support\NotificationDispatchRequest;
use Illuminate\Container\Attributes\Bind;

/**
 * The single dispatch entry point for the notifications substrate.
 *
 * Every consumer that wants to fire a notification — every module,
 * every action, every listener — goes through this interface. There is
 * no other sanctioned path. Channel modules never expose their own
 * `send()` method to consumers; they subscribe to `NotificationDispatched`
 * and translate it to their transport.
 *
 * Keeping this discipline is what lets us extract the whole substrate
 * to a Node microservice later without a rewrite: the event contract
 * stays; the transport behind it swaps.
 *
 * The default implementation ships as {@see DefaultDispatchGateway}.
 * Consumer apps override `#[Bind]` on this interface when they need a
 * bespoke dispatch pipeline (e.g. AB testing splitter, feature-flag
 * gate, custom preference logic).
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Bind(DefaultDispatchGateway::class)]
interface DispatchGatewayInterface
{
    /**
     * Dispatch a notification. Never invoked twice for the same
     * `event_id` — dispatch is idempotent by the caller's event id.
     *
     * @param  NotificationDispatchRequest  $request  The dispatch request payload.
     * @return Notification|null  The persisted notification row, or null when
     *                            the dispatch was suppressed (kill switch,
     *                            unsubscribed, ineligible recipient).
     */
    public function dispatch(NotificationDispatchRequest $request): ?Notification;
}
