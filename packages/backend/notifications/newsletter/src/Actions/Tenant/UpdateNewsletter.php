<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Newsletter\Contracts\Data\NewsletterInterface;
use Stackra\Newsletter\Contracts\Repositories\NewsletterRepositoryInterface;
use Stackra\Newsletter\Data\NewsletterData;
use Stackra\Newsletter\Data\Requests\UpdateNewsletterRequestData;
use Stackra\Newsletter\Enums\NewsletterPermission;
use Stackra\Newsletter\Exceptions\NewsletterNotFoundException;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Patch;
use Stackra\Routing\Concerns\AsController;

/**
 * `PATCH /api/v1/newsletters/{newsletter}` — update an existing
 * newsletter.
 *
 * Applies only the keys the caller sent — every field on the
 * request DTO is optional. Slug is NEVER editable via this action.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletters.update')]
#[Patch('/api/v1/newsletters/{newsletter}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NewsletterPermission::NewslettersUpdate)]
final class UpdateNewsletter
{
    use AsController;

    public function __construct(
        private readonly NewsletterRepositoryInterface $newsletters,
    ) {
    }

    public function __invoke(string $newsletter, UpdateNewsletterRequestData $data): NewsletterData
    {
        $model = $this->newsletters->find($newsletter);
        if ($model === null) {
            throw new NewsletterNotFoundException('Newsletter not found.');
        }

        $updates = [];
        if ($data->name !== null) {
            $updates[NewsletterInterface::ATTR_NAME] = $data->name;
        }
        if ($data->description !== null) {
            $updates[NewsletterInterface::ATTR_DESCRIPTION] = $data->description;
        }
        if ($data->cadence !== null) {
            $updates[NewsletterInterface::ATTR_CADENCE] = $data->cadence->value;
        }
        if ($data->confirmationRequired !== null) {
            $updates[NewsletterInterface::ATTR_CONFIRMATION_REQUIRED] = $data->confirmationRequired;
        }
        if ($data->senderConfig !== null) {
            $updates[NewsletterInterface::ATTR_SENDER_CONFIG] = $data->senderConfig;
        }
        if ($data->brand !== null) {
            $updates[NewsletterInterface::ATTR_BRAND] = $data->brand;
        }
        if ($data->reputationThresholds !== null) {
            $updates[NewsletterInterface::ATTR_REPUTATION_THRESHOLDS] = $data->reputationThresholds;
        }

        if ($updates !== []) {
            $model->update($updates);
        }

        return NewsletterData::fromModel($model->refresh());
    }
}
