<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Jobs;

use Stackra\Newsletter\Contracts\Data\NewsletterAudienceInterface;
use Stackra\Newsletter\Contracts\Repositories\NewsletterAudienceRepositoryInterface;
use Stackra\Newsletter\Contracts\Services\AudienceEvaluatorInterface;
use Stackra\Newsletter\Events\NewsletterAudienceRefreshed;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Attributes\UniqueFor;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Rebuild an audience's cached subscriber list.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Timeout(300)]
#[Tries(2)]
#[UniqueFor(300)]
final class BuildAudienceSegmentJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly string $audienceId)
    {
    }

    public function uniqueId(): string
    {
        return 'newsletter:audience:' . $this->audienceId;
    }

    public function handle(
        NewsletterAudienceRepositoryInterface $audiences,
        AudienceEvaluatorInterface $evaluator,
    ): void {
        $audience = $audiences->find($this->audienceId);
        if ($audience === null) {
            return;
        }

        $ids = $evaluator->evaluate($audience);

        $audience->update([
            NewsletterAudienceInterface::ATTR_CACHED_SUBSCRIBER_IDS   => $ids,
            NewsletterAudienceInterface::ATTR_CACHED_SUBSCRIBER_COUNT => \count($ids),
            NewsletterAudienceInterface::ATTR_CACHE_REFRESHED_AT      => \now(),
        ]);

        NewsletterAudienceRefreshed::dispatch(
            (string) $audience->getKey(),
            \count($ids),
        );
    }

    public function failed(\Throwable $e): void
    {
    }
}
