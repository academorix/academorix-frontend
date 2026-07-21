<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Newsletter\Contracts\Data\NewsletterIssueInterface;
use Stackra\Newsletter\Contracts\Repositories\NewsletterIssueRepositoryInterface;
use Stackra\Newsletter\Data\NewsletterIssueData;
use Stackra\Newsletter\Data\Requests\CancelIssueRequestData;
use Stackra\Newsletter\Enums\NewsletterIssueStatus;
use Stackra\Newsletter\Enums\NewsletterPermission;
use Stackra\Newsletter\Exceptions\NewsletterIssueNotFoundException;
use Stackra\Newsletter\Exceptions\NewsletterStateInvalidTransitionException;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;

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
