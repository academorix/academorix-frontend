<?php

declare(strict_types=1);

namespace Academorix\Notifications\InApp\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a bulk mark-all-read operation completes for one
 * addressee. Fires exactly once per caller — the individual read
 * events are suppressed (would generate N events for N deliveries;
 * that's fan-out noise).
 *
 * ## Consumers
 *   - `notifications-in-app::UpdateUnreadCountCache` — invalidates
 *     the badge count cache for the addressee (setting count = 0).
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-in-app/events.json
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'notifications.in-app.bulk-mark-all-read')]
final readonly class InAppBulkMarkAllRead implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string  $tenantId          Active tenant.
     * @param  string  $addresseeId       Reader id.
     * @param  int     $deliveriesMarked  Rows newly-marked (excludes
     *                                    already-read rows — an
     *                                    idempotent bulk-read counts
     *                                    only the new transitions).
     */
    public function __construct(
        public string $tenantId,
        public string $addresseeId,
        public int $deliveriesMarked,
    ) {
    }
}
