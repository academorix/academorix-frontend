<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Newsletter\Contracts\Repositories\NewsletterIssueRepositoryInterface;
use Academorix\Newsletter\Data\NewsletterIssueData;
use Academorix\Newsletter\Enums\NewsletterPermission;
use Academorix\Newsletter\Exceptions\NewsletterIssueNotFoundException;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;

/**
 * `GET /api/v1/newsletters/{newsletter}/issues/{issue}` — show a
 * single issue.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletter-issues.show')]
#[Get('/api/v1/newsletters/{newsletter}/issues/{issue}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NewsletterPermission::IssuesView)]
final class ShowNewsletterIssue
{
    use AsController;

    public function __construct(
        private readonly NewsletterIssueRepositoryInterface $issues,
    ) {
    }

    public function __invoke(string $newsletter, string $issue): NewsletterIssueData
    {
        $model = $this->issues->find($issue);
        if ($model === null) {
            throw new NewsletterIssueNotFoundException('Issue not found.');
        }

        return NewsletterIssueData::fromModel($model);
    }
}
