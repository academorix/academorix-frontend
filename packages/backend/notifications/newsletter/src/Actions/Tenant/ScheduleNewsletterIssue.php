<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Newsletter\Contracts\Services\NewsletterServiceInterface;
use Stackra\Newsletter\Data\NewsletterCampaignData;
use Stackra\Newsletter\Data\Requests\ScheduleNewsletterIssueRequestData;
use Stackra\Newsletter\Enums\NewsletterPermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Carbon\Carbon;

/**
 * `POST /api/v1/newsletters/{newsletter}/issues/{issue}/schedule` —
 * schedule an issue for send against an audience at a specific time.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletter-issues.schedule')]
#[Post('/api/v1/newsletters/{newsletter}/issues/{issue}/schedule')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NewsletterPermission::IssuesPublish)]
final class ScheduleNewsletterIssue
{
    use AsController;

    public function __construct(
        private readonly NewsletterServiceInterface $service,
    ) {
    }

    public function __invoke(
        string $newsletter,
        string $issue,
        ScheduleNewsletterIssueRequestData $data,
    ): NewsletterCampaignData {
        $campaign = $this->service->scheduleIssue(
            $issue,
            $data->audienceId,
            Carbon::parse($data->scheduledAt),
        );

        return NewsletterCampaignData::fromModel($campaign);
    }
}
