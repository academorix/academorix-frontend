<?php

declare(strict_types=1);

namespace Academorix\Webhook\Attributes;

use Attribute;

/**
 * Register a class as a publishable webhook event.
 *
 * The build-time compiler discovers `#[AsWebhookEvent]`-marked classes
 * via `Academorix\Foundation\Contracts\DiscoversAttributes` and hands
 * them to {@see \Academorix\Webhook\Services\WebhookRegistry}, which
 * stores the event catalogue subscribers pick from when creating a
 * {@see \Academorix\Webhook\Models\WebhookSubscription}.
 *
 * ```php
 * #[AsWebhookEvent(
 *     name: 'invitation.sent',
 *     version: 'v1',
 *     description: 'Fired when an invitation is dispatched.',
 * )]
 * final readonly class InvitationSent
 * {
 * }
 * ```
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsWebhookEvent
{
    /**
     * @param  string  $name         Dot-separated event identifier (e.g. `invitation.sent`).
     * @param  string  $version      Semantic payload version (e.g. `v1`).
     * @param  string  $description  One-sentence description shown in admin surfaces.
     */
    public function __construct(
        public string $name,
        public string $version = 'v1',
        public string $description = '',
    ) {
    }
}
