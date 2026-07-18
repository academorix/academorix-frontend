<?php

declare(strict_types=1);

namespace Academorix\Notifications\Mail\Contracts\Services;

use Academorix\Notifications\Mail\Channels\MailChannel;
use Academorix\Notifications\Models\Notification;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for the mail notification channel driver.
 *
 * The driver knows how to translate one persisted
 * {@see \Academorix\Notifications\Models\Notification} into an
 * outbound email:
 *
 *   1. Resolve the template (React Email pre-rendered HTML) and
 *      interpolate variables through Laravel Blade.
 *   2. Check the recipient against
 *      {@see \Academorix\Notifications\Mail\Contracts\Repositories\MailSuppressionRepositoryInterface}
 *      — a suppressed address short-circuits to
 *      `NotificationDelivery.state = permanently_failed`.
 *   3. Inject the CAN-SPAM footer + RFC 8058 `List-Unsubscribe`
 *      headers.
 *   4. Hand off to Laravel Mail's `MailManager` for transport.
 *   5. Capture the provider's message id back onto the
 *      `NotificationDelivery` row for later webhook correlation.
 *
 * The parent notifications module fires `NotificationDispatched`;
 * this module's listener dispatches
 * {@see \Academorix\Notifications\Mail\Jobs\SendMailJob} which
 * resolves this contract to do the work.
 *
 * `#[Bind(MailChannel::class)]` — Pattern A per
 * `.kiro/steering/php-attributes.md` §"Bind vs Overrides". Consumer
 * apps override the binding to a bespoke driver (analytics wrapper,
 * cost-tracking overlay) without touching the job.
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[Bind(MailChannel::class)]
interface MailChannelInterface
{
    /**
     * Send a notification through the mail transport.
     *
     * Writes / updates the `NotificationDelivery` row + hands off to
     * `Mail::mailer(...)->send(...)`. A suppressed recipient
     * short-circuits to a `permanently_failed` delivery without
     * touching the transport. A provider 5xx surfaces as a retryable
     * failure that {@see \Academorix\Notifications\Mail\Jobs\SendMailJob}
     * schedules with the configured backoff.
     *
     * @param  Notification  $notification  The persisted notification
     *                                      (produced by DispatchGateway).
     * @return string|null  The provider's message id when captured
     *                      (`X-Message-Id` header, SES message id,
     *                      etc.); `null` when the transport does
     *                      not surface one (`log`, `array`) or the
     *                      address was suppressed.
     */
    public function deliver(Notification $notification): ?string;
}
