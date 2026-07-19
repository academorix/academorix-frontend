<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Newsletter\Contracts\Data\NewsletterAudienceInterface;
use Academorix\Newsletter\Contracts\Repositories\NewsletterAudienceRepositoryInterface;
use Academorix\Newsletter\Enums\NewsletterPermission;
use Academorix\Newsletter\Exceptions\NewsletterAudienceNotFoundException;
use Academorix\Newsletter\Exceptions\NewsletterStateInvalidTransitionException;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Delete;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;

/**
 * `DELETE /api/v1/newsletters/{newsletter}/audiences/{audience}` —
 * soft-delete an audience. Refuses on the default audience.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletter-audiences.delete')]
#[Delete('/api/v1/newsletters/{newsletter}/audiences/{audience}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NewsletterPermission::AudiencesDelete)]
final class DeleteNewsletterAudience
{
    use AsController;

    public function __construct(
        private readonly NewsletterAudienceRepositoryInterface $audiences,
    ) {
    }

    public function __invoke(string $newsletter, string $audience): JsonResponse
    {
        $model = $this->audiences->find($audience);
        if ($model === null) {
            throw new NewsletterAudienceNotFoundException('Audience not found.');
        }

        if ((bool) $model->{NewsletterAudienceInterface::ATTR_IS_DEFAULT} === true) {
            throw new NewsletterStateInvalidTransitionException(
                'The default audience cannot be deleted.',
            );
        }

        $model->delete();

        return response()->json(null, JsonResponse::HTTP_NO_CONTENT);
    }
}
