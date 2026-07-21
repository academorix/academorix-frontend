<?php

declare(strict_types=1);

namespace Stackra\Notifications\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Notifications\Models\NotificationTemplate;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a template transitions to `published`.
 *
 * SOC 2 CC8.1 change-management signal — consumers invalidate the
 * template registry cache + write compliance evidence.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'notifications.template.published')]
final readonly class TemplatePublished implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  NotificationTemplate  $template  The published template.
     */
    public function __construct(public NotificationTemplate $template)
    {
    }
}
