<?php

declare(strict_types=1);

namespace Stackra\Notifications\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Notifications\Contracts\Data\NotificationTemplateInterface;
use Stackra\Notifications\Contracts\Repositories\NotificationTemplateRepositoryInterface;
use Stackra\Notifications\Data\NotificationTemplateData;
use Stackra\Notifications\Data\Requests\CreateTemplateRequestData;
use Stackra\Notifications\Enums\NotificationsPermission;
use Stackra\Notifications\Enums\TemplateState;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;

/**
 * `POST /api/v1/tenant/notification-templates` — create a tenant
 * override template.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.tenant.templates.create')]
#[Post('/api/v1/tenant/notification-templates')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NotificationsPermission::TemplatesCreate)]
final class CreateTemplate
{
    use AsController;

    public function __construct(
        private readonly NotificationTemplateRepositoryInterface $templates,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(CreateTemplateRequestData $data): NotificationTemplateData
    {
        $tenant = $this->tenantContext->currentOrFail();

        $template = $this->templates->create([
            NotificationTemplateInterface::ATTR_TENANT_ID          => (string) $tenant->getKey(),
            NotificationTemplateInterface::ATTR_KEY                => $data->key,
            NotificationTemplateInterface::ATTR_CATEGORY_SLUG      => $data->categorySlug,
            NotificationTemplateInterface::ATTR_CHANNEL            => $data->channel->value,
            NotificationTemplateInterface::ATTR_LOCALE             => $data->locale,
            NotificationTemplateInterface::ATTR_VERSION            => 1,
            NotificationTemplateInterface::ATTR_STATE              => TemplateState::Draft->value,
            NotificationTemplateInterface::ATTR_IS_SYSTEM          => false,
            NotificationTemplateInterface::ATTR_SUBJECT_TEMPLATE   => $data->subjectTemplate,
            NotificationTemplateInterface::ATTR_BODY_RENDERED_HTML => $data->bodyRenderedHtml,
        ]);

        return NotificationTemplateData::fromModel($template);
    }
}
