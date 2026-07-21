<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Newsletter\Contracts\Data\NewsletterIssueInterface;
use Stackra\Newsletter\Contracts\Repositories\NewsletterIssueRepositoryInterface;
use Stackra\Newsletter\Data\NewsletterIssueData;
use Stackra\Newsletter\Data\Requests\UpdateNewsletterIssueRequestData;
use Stackra\Newsletter\Enums\NewsletterIssueStatus;
use Stackra\Newsletter\Enums\NewsletterPermission;
use Stackra\Newsletter\Exceptions\NewsletterIssueNotFoundException;
use Stackra\Newsletter\Exceptions\NewsletterStateInvalidTransitionException;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Patch;
use Stackra\Routing\Concerns\AsController;

/**
 * `PATCH /api/v1/newsletters/{newsletter}/issues/{issue}` — update
 * an unsent issue.
 *
 * Refuses to update issues past the `draft` / `scheduled` states —
 * `sending` and `sent` issues are historical evidence.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletter-issues.update')]
#[Patch('/api/v1/newsletters/{newsletter}/issues/{issue}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NewsletterPermission::IssuesUpdate)]
final class UpdateNewsletterIssue
{
    use AsController;

    public function __construct(
        private readonly NewsletterIssueRepositoryInterface $issues,
    ) {
    }

    public function __invoke(string $newsletter, string $issue, UpdateNewsletterIssueRequestData $data): NewsletterIssueData
    {
        $model = $this->issues->find($issue);
        if ($model === null) {
            throw new NewsletterIssueNotFoundException('Issue not found.');
        }

        $status = $model->{NewsletterIssueInterface::ATTR_STATUS};
        $value  = $status instanceof \BackedEnum ? $status->value : (string) $status;
        if (! \in_array($value, [
            NewsletterIssueStatus::Draft->value,
            NewsletterIssueStatus::Scheduled->value,
        ], true)) {
            throw new NewsletterStateInvalidTransitionException(
                'Only draft or scheduled issues can be updated.',
            );
        }

        $updates = [];
        if ($data->subject !== null) {
            $updates[NewsletterIssueInterface::ATTR_SUBJECT] = $data->subject;
        }
        if ($data->preheader !== null) {
            $updates[NewsletterIssueInterface::ATTR_PREHEADER] = $data->preheader;
        }
        if ($data->contentBlocks !== null) {
            $updates[NewsletterIssueInterface::ATTR_CONTENT_BLOCKS] = $data->contentBlocks;
        }
        if ($data->variables !== null) {
            $updates[NewsletterIssueInterface::ATTR_VARIABLES] = $data->variables;
        }

        if ($updates !== []) {
            $model->update($updates);
        }

        return NewsletterIssueData::fromModel($model->refresh());
    }
}
