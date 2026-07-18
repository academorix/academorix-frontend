<?php

declare(strict_types=1);

namespace Academorix\Localization\Actions\Tenant\Translations;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Localization\Contracts\Data\TranslationInterface;
use Academorix\Localization\Contracts\Repositories\TranslationRepositoryInterface;
use Academorix\Localization\Data\Resources\TranslationData;
use Academorix\Localization\Enums\LocalizationPermission;
use Academorix\Localization\Models\Translation;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/translations` — list tenant translations.
 *
 * Returns rows scoped to the caller's tenant. Platform-default rows
 * (`tenant_id IS NULL`) are omitted from this endpoint — tenant
 * users see them via the resolution chain, not the CRUD surface.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsAction(name: 'localization.tenant.translations.list')]
#[Get('/api/v1/translations')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve', 'locale.resolve'])]
#[RequirePermission(LocalizationPermission::TranslationsViewAny)]
final class ListTranslations
{
    use AsController;

    public function __construct(
        private readonly TranslationRepositoryInterface $translations,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    /**
     * @return DataCollection<int, TranslationData>
     */
    public function __invoke(): DataCollection
    {
        $tenant = $this->tenantContext->currentOrFail();

        $rows = $this->translations->query()
            ->where(TranslationInterface::ATTR_TENANT_ID, (string) $tenant->getKey())
            ->orderByDesc(TranslationInterface::ATTR_UPDATED_AT)
            ->limit(200)
            ->get()
            ->map(static fn (Translation $row): TranslationData => TranslationData::fromModel($row));

        return new DataCollection(TranslationData::class, $rows);
    }
}
