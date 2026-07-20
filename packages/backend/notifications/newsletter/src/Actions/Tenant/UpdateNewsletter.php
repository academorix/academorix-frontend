<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Newsletter\Contracts\Data\NewsletterInterface;
use Academorix\Newsletter\Contracts\Repositories\NewsletterRepositoryInterface;
use Academorix\Newsletter\Data\NewsletterData;
use Academorix\Newsletter\Data\Requests\UpdateNewsletterRequestData;
use Academorix\Newsletter\Enums\NewsletterPermission;
use Academorix\Newsletter\Exceptions\NewsletterNotFoundException;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Patch;
use Academorix\Routing\Concerns\AsController;

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
