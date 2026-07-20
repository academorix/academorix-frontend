<?php

declare(strict_types=1);

namespace Academorix\Notifications\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Attributes\UniqueFor;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Refresh the cached recipient payload (email, phone, locale,
 * timezone) for a user after `UserUpdated`.
 *
 * `UniqueFor(60)` — save-storm collapse; rapid edits only refresh
 * once per minute.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Tries(3)]
final class RefreshUserCacheJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  string  $userId  User id to refresh.
     */
    public function __construct(public readonly string $userId)
    {
    }

    #[UniqueFor(60)]
    public function uniqueId(): string
    {
        return 'user-cache:' . $this->userId;
    }

    /**
     * Reload the user's recipient block into cache.
     */
    public function handle(): void
    {
    }

    public function failed(\Throwable $e): void
    {
    }
}
