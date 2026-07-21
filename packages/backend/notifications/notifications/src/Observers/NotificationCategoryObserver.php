<?php

declare(strict_types=1);

namespace Stackra\Notifications\Observers;

use Stackra\Notifications\Events\CategoryRegistered;
use Stackra\Notifications\Models\NotificationCategory;

/**
 * Lifecycle side effects on {@see NotificationCategory}.
 *
 * Fires `CategoryRegistered` on create so the in-memory registry can
 * invalidate its cache when tenants override platform categories.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationCategoryObserver
{
    /**
     * `created` — a new category row landed (either platform seed or
     * tenant override).
     */
    public function created(NotificationCategory $category): void
    {
        CategoryRegistered::dispatch($category);
    }
}
