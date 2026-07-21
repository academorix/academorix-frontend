<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Newsletter\Contracts\Repositories\NewsletterIssueRepositoryInterface;
use Stackra\Newsletter\Enums\NewsletterPermission;
use Stackra\Newsletter\Exceptions\NewsletterIssueNotFoundException;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Delete;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;

/**
 * `DELETE /api/v1/newsletters/{newsletter}/issues/{issue}` —
 * soft-delete an issue.
 *
 * The policy refuses to delete sent + scheduled issues; the caller
 * sees a 403 in those cases.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletter-issues.delete')]
#[Delete('/api/v1/newsletters/{newsletter}/issues/{issue}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NewsletterPermission::IssuesDelete)]
final class DeleteNewsletterIssue
{
    use AsController;

    public function __construct(
        private readonly NewsletterIssueRepositoryInterface $issues,
    ) {
    }

    public function __invoke(string $newsletter, string $issue): JsonResponse
    {
        $model = $this->issues->find($issue);
        if ($model === null) {
            throw new NewsletterIssueNotFoundException('Issue not found.');
        }

        $model->delete();

        return response()->json(null, JsonResponse::HTTP_NO_CONTENT);
    }
}
