<?php

declare(strict_types=1);

namespace Academorix\Versioning\Jobs;

use Academorix\Versioning\Contracts\Repositories\DeprecationNoticeRepositoryInterface;
use Academorix\Versioning\Contracts\Services\DeprecationNoticeServiceInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Publish a draft {@see \Academorix\Versioning\Models\DeprecationNotice}
 * asynchronously.
 *
 * Wraps {@see DeprecationNoticeServiceInterface::publish()} so the
 * customer-notification fanout doesn't block the HTTP admin action.
 * The service emits {@see \Academorix\Versioning\Events\DeprecationNoticePublished}
 * on completion; downstream listeners fan-out per-tenant notifications.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[Queue('default')]
#[Timeout(60)]
#[Tries(3)]
final class PublishDeprecationNoticeJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly string $noticeId)
    {
    }

    /**
     * Locate the notice + publish it via the service.
     */
    public function handle(
        DeprecationNoticeRepositoryInterface $notices,
        DeprecationNoticeServiceInterface $service,
    ): void {
        $notice = $notices->find($this->noticeId);
        if ($notice === null) {
            return;
        }

        $service->publish($notice);
    }

    /**
     * The queue exhausted its retry budget — log intent for later
     * observability wiring.
     */
    public function failed(\Throwable $e): void
    {
    }
}
