<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Newsletter\Contracts\Data\NewsletterInterface;
use Academorix\Newsletter\Contracts\Data\NewsletterIssueInterface;
use Academorix\Newsletter\Contracts\Repositories\NewsletterIssueRepositoryInterface;
use Academorix\Newsletter\Contracts\Repositories\NewsletterRepositoryInterface;
use Academorix\Newsletter\Data\NewsletterIssueData;
use Academorix\Newsletter\Data\Requests\CreateNewsletterIssueRequestData;
use Academorix\Newsletter\Enums\NewsletterIssueStatus;
use Academorix\Newsletter\Enums\NewsletterPermission;
use Academorix\Newsletter\Exceptions\NewsletterNotFoundException;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;

/**
 * `POST /api/v1/newsletters/{newsletter}/issues` — draft a new
 * issue.
 *
 * Auto-increments the parent newsletter's `last_issue_number` and
 * assigns it to the new issue for non-manual cadences.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletter-issues.create')]
#[Post('/api/v1/newsletters/{newsletter}/issues')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NewsletterPermission::IssuesCreate)]
final class CreateNewsletterIssue
{
    use AsController;

    public function __construct(
        private readonly NewsletterIssueRepositoryInterface $issues,
        private readonly NewsletterRepositoryInterface $newsletters,
    ) {
    }

    public function __invoke(string $newsletter, CreateNewsletterIssueRequestData $data): NewsletterIssueData
    {
        $parent = $this->newsletters->find($newsletter);
        if ($parent === null) {
            throw new NewsletterNotFoundException('Newsletter not found.');
        }

        $issueNumber = (int) $parent->{NewsletterInterface::ATTR_LAST_ISSUE_NUMBER} + 1;

        $issue = $this->issues->create([
            NewsletterIssueInterface::ATTR_TENANT_ID      => (string) $parent->{NewsletterInterface::ATTR_TENANT_ID},
            NewsletterIssueInterface::ATTR_NEWSLETTER_ID  => (string) $parent->getKey(),
            NewsletterIssueInterface::ATTR_SLUG           => $data->slug,
            NewsletterIssueInterface::ATTR_ISSUE_NUMBER   => $issueNumber,
            NewsletterIssueInterface::ATTR_SUBJECT        => $data->subject,
            NewsletterIssueInterface::ATTR_PREHEADER      => $data->preheader,
            NewsletterIssueInterface::ATTR_CONTENT_BLOCKS => $data->contentBlocks,
            NewsletterIssueInterface::ATTR_VARIABLES      => $data->variables,
            NewsletterIssueInterface::ATTR_STATUS         => NewsletterIssueStatus::Draft->value,
        ]);

        $parent->update([
            NewsletterInterface::ATTR_LAST_ISSUE_NUMBER => $issueNumber,
        ]);

        return NewsletterIssueData::fromModel($issue->refresh());
    }
}
