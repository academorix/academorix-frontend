<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Newsletter\Contracts\Data\NewsletterIssueInterface;
use Academorix\Newsletter\Contracts\Repositories\NewsletterIssueRepositoryInterface;
use Academorix\Newsletter\Data\NewsletterIssueData;
use Academorix\Newsletter\Data\Requests\CancelIssueRequestData;
use Academorix\Newsletter\Enums\NewsletterIssueStatus;
use Academorix\Newsletter\Enums\NewsletterPermission;
use Academorix\Newsletter\Exceptions\NewsletterIssueNotFoundException;
use Academorix\Newsletter\Exceptions\NewsletterStateInvalidTransitionException;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;

/**
 * `POST /api/v1/newsletters/{newsletter}/issues/{issue}/cancel` —
 * cancel an unsent issue.
 *
 * Refuses when the issue is already `sent` or `cancelled`.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletter-issues.cancel')]
#[Post('/api/v1/newsletters/{newsletter}/issues/{issue}/cancel')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NewsletterPermission::IssuesPublish)]
final class CancelNewsletterIssue
{
    use AsController;

    public function __construct(
        private readonly NewsletterIssueRepositoryInterface $issues,
    ) {
    }

    public function __invoke(string $newsletter, string $issue, CancelIssueRequestData $data): NewsletterIssueData
    {
        $model = $this->issues->find($issue);
        if ($model === null) {
            throw new NewsletterIssueNotFoundException('Issue not found.');
        }

        $status = $model->{NewsletterIssueInterface::ATTR_STATUS};
        $value  = $status instanceof \BackedEnum ? $status->value : (string) $status;
        if (\in_array($value, [
            NewsletterIssueStatus::Sent->value,
            NewsletterIssueStatus::Cancelled->value,
        ], true)) {
            throw new NewsletterStateInvalidTransitionException(
                'Only draft / scheduled / sending issues can be cancelled.',
            );
        }

        $model->update([
            NewsletterIssueInterface::ATTR_STATUS        => NewsletterIssueStatus::Cancelled->value,
            NewsletterIssueInterface::ATTR_CANCELLED_AT  => \now(),
            NewsletterIssueInterface::ATTR_CANCEL_REASON => $data->reason,
        ]);

        return NewsletterIssueData::fromModel($model->refresh());
    }
}
