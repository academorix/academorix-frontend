<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Newsletter\Contracts\Data\NewsletterAudienceInterface;
use Academorix\Newsletter\Contracts\Repositories\NewsletterAudienceRepositoryInterface;
use Academorix\Newsletter\Data\NewsletterAudienceData;
use Academorix\Newsletter\Data\Requests\UpdateAudienceRequestData;
use Academorix\Newsletter\Enums\NewsletterPermission;
use Academorix\Newsletter\Exceptions\NewsletterAudienceNotFoundException;
use Academorix\Newsletter\Jobs\BuildAudienceSegmentJob;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Patch;
use Academorix\Routing\Concerns\AsController;

/**
 * `PATCH /api/v1/newsletters/{newsletter}/audiences/{audience}` —
 * update an audience.
 *
 * When the expression changes, dispatches a rebuild job so the
 * cached subscriber list matches the new definition.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletter-audiences.update')]
#[Patch('/api/v1/newsletters/{newsletter}/audiences/{audience}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NewsletterPermission::AudiencesUpdate)]
final class UpdateNewsletterAudience
{
    use AsController;

    public function __construct(
        private readonly NewsletterAudienceRepositoryInterface $audiences,
    ) {
    }

    public function __invoke(
        string $newsletter,
        string $audience,
        UpdateAudienceRequestData $data,
    ): NewsletterAudienceData {
        $model = $this->audiences->find($audience);
        if ($model === null) {
            throw new NewsletterAudienceNotFoundException('Audience not found.');
        }

        $updates = [];
        $expressionChanged = false;
        if ($data->name !== null) {
            $updates[NewsletterAudienceInterface::ATTR_NAME] = $data->name;
        }
        if ($data->description !== null) {
            $updates[NewsletterAudienceInterface::ATTR_DESCRIPTION] = $data->description;
        }
        if ($data->expression !== null) {
            $updates[NewsletterAudienceInterface::ATTR_EXPRESSION] = $data->expression;
            $expressionChanged = true;
        }

        if ($updates !== []) {
            $model->update($updates);
        }

        if ($expressionChanged) {
            BuildAudienceSegmentJob::dispatch((string) $model->getKey());
        }

        return NewsletterAudienceData::fromModel($model->refresh());
    }
}
