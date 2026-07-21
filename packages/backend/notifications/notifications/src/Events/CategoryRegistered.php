<?php

declare(strict_types=1);

namespace Stackra\Notifications\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Notifications\Models\NotificationCategory;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a new category row lands — either during platform
 * seed, tenant override creation, or module discovery.
 *
 * Consumers invalidate the category registry cache.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'notifications.category.registered')]
final readonly class CategoryRegistered implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  NotificationCategory  $category  The registered category row.
     */
    public function __construct(public NotificationCategory $category)
    {
    }
}
