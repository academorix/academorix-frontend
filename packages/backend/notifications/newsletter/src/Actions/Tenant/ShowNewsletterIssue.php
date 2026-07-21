<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Newsletter\Contracts\Repositories\NewsletterIssueRepositoryInterface;
use Stackra\Newsletter\Data\NewsletterIssueData;
use Stackra\Newsletter\Enums\NewsletterPermission;
use Stackra\Newsletter\Exceptions\NewsletterIssueNotFoundException;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;

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
