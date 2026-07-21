<?php

declare(strict_types=1);

namespace Stackra\Notifications\Contracts\Services;

use Stackra\Notifications\Services\DefaultNotificationPreferenceResolver;
use Stackra\Notifications\Support\NotificationPreferenceDecision;
use Illuminate\Container\Attributes\Bind;

/**
 * Resolves the effective preference for a `(user, category, channel)`
 * tuple at dispatch time.
 *
 * Reads the persisted `NotificationPreference` row, the parent
 * `NotificationCategory` defaults, and the module-declared consent tier
 * to answer three questions:
 *
 *   1. Is delivery enabled for this tuple?
 *   2. Should we dispatch immediately or defer to a digest bucket?
 *   3. Is the current moment inside the user's quiet-hours window?
 *
 * The default implementation ships as
 * {@see DefaultNotificationPreferenceResolver}; consumer apps override
 * `#[Bind]` when they need bespoke consent logic.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Bind(DefaultNotificationPreferenceResolver::class)]
interface NotificationPreferenceResolverInterface
{
    /**
     * Resolve the effective decision for the tuple.
     *
     * @param  string  $tenantId      Active tenant.
     * @param  string  $userId        Recipient user id.
     * @param  string  $categorySlug  Category slug.
     * @param  string  $channel       Channel key.
     */
    public function resolve(
        string $tenantId,
        string $userId,
        string $categorySlug,
        string $channel,
    ): NotificationPreferenceDecision;
}
