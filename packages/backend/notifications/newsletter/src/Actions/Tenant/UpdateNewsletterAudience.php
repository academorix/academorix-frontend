<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Newsletter\Contracts\Data\NewsletterAudienceInterface;
use Stackra\Newsletter\Contracts\Repositories\NewsletterAudienceRepositoryInterface;
use Stackra\Newsletter\Data\NewsletterAudienceData;
use Stackra\Newsletter\Data\Requests\UpdateAudienceRequestData;
use Stackra\Newsletter\Enums\NewsletterPermission;
use Stackra\Newsletter\Exceptions\NewsletterAudienceNotFoundException;
use Stackra\Newsletter\Jobs\BuildAudienceSegmentJob;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Patch;
use Stackra\Routing\Concerns\AsController;

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
