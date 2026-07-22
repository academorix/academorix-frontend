<?php

declare(strict_types=1);

namespace Stackra\Localization\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Localization\Contracts\Data\TranslationInterface;
use Stackra\Localization\Contracts\Repositories\TranslationRepositoryInterface;
use Stackra\Localization\Data\Requests\CreateTranslationRequestData;
use Stackra\Localization\Data\Resources\TranslationData;
use Stackra\Localization\Enums\LocalizationPermission;
use Stackra\Localization\Enums\TranslationSource;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;

/**
 * `POST /api/v1/translations` — tenant admin creates a hand-authored
 * translation override.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsAction(name: 'localization.tenant.translations.create')]
#[Post('/api/v1/translations')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve', 'locale.resolve'])]
#[RequirePermission(LocalizationPermission::TranslationsCreate)]
final class CreateTranslation
{
    use AsController;

    public function __construct(
        private readonly TranslationRepositoryInterface $translations,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(CreateTranslationRequestData $data): TranslationData
    {
        $tenant = $this->tenantContext->currentOrFail();

        $row = $this->translations->create([
            TranslationInterface::ATTR_TENANT_ID   => (string) $tenant->getKey(),
            TranslationInterface::ATTR_LANGUAGE_ID => $data->languageId,
            TranslationInterface::ATTR_NAMESPACE   => $data->namespace,
            TranslationInterface::ATTR_GROUP       => $data->group,
            TranslationInterface::ATTR_KEY         => $data->key,
            TranslationInterface::ATTR_VALUE       => $data->value,
            TranslationInterface::ATTR_SOURCE      => TranslationSource::Manual,
        ]);

        return TranslationData::fromModel($row);
    }
}
