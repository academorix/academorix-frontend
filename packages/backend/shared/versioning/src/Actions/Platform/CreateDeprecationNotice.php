<?php

declare(strict_types=1);

namespace Academorix\Versioning\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Versioning\Contracts\Data\DeprecationNoticeInterface;
use Academorix\Versioning\Contracts\Repositories\DeprecationNoticeRepositoryInterface;
use Academorix\Versioning\Data\DeprecationNoticeData;
use Academorix\Versioning\Data\Requests\CreateDeprecationNoticeRequestData;
use Academorix\Versioning\Enums\VersioningPermission;
use Academorix\Versioning\Jobs\PublishDeprecationNoticeJob;

/**
 * `POST /api/v1/platform/versioning/deprecation-notices` — create a
 * new DeprecationNotice. When `is_active` is true, dispatches
 * {@see PublishDeprecationNoticeJob} to run the customer-notification
 * fanout asynchronously.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsAction(name: 'versioning.platform.deprecation_notices.create')]
#[Post('/api/v1/platform/versioning/deprecation-notices')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(VersioningPermission::Manage)]
final class CreateDeprecationNotice
{
    use AsController;

    public function __construct(
        private readonly DeprecationNoticeRepositoryInterface $notices,
    ) {
    }

    public function __invoke(CreateDeprecationNoticeRequestData $data): DeprecationNoticeData
    {
        $notice = $this->notices->create([
            DeprecationNoticeInterface::ATTR_API_VERSION_ID      => $data->apiVersionId,
            DeprecationNoticeInterface::ATTR_SURFACE             => $data->surface->value,
            DeprecationNoticeInterface::ATTR_TITLE               => $data->title,
            DeprecationNoticeInterface::ATTR_BODY                => $data->body,
            DeprecationNoticeInterface::ATTR_STARTS_AT           => $data->startsAt,
            DeprecationNoticeInterface::ATTR_ENDS_AT             => $data->endsAt,
            DeprecationNoticeInterface::ATTR_IS_ACTIVE           => $data->isActive,
            DeprecationNoticeInterface::ATTR_REPLACEMENT_VERSION => $data->replacementVersion,
        ]);

        if ($data->isActive) {
            PublishDeprecationNoticeJob::dispatch((string) $notice->getKey());
        }

        return DeprecationNoticeData::fromModel($notice->refresh());
    }
}
