<?php

declare(strict_types=1);

namespace Academorix\Localization\Actions\Platform\Translations;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Localization\Contracts\Repositories\TranslationRepositoryInterface;
use Academorix\Localization\Data\Resources\TranslationData;
use Academorix\Localization\Enums\LocalizationPermission;
use Academorix\Localization\Models\Translation;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/platform/translations` — platform-admin cross-tenant
 * read of translations for observability + incident triage.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsAction(name: 'localization.platform.translations.list')]
#[Get('/api/v1/platform/translations')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(LocalizationPermission::PlatformTranslationsViewAny)]
final class ListPlatformTranslations
{
    use AsController;

    public function __construct(
        private readonly TranslationRepositoryInterface $translations,
    ) {
    }

    /**
     * @return DataCollection<int, TranslationData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->translations
            ->paginate()
            ->getCollection()
            ->map(static fn (Translation $row): TranslationData => TranslationData::fromModel($row));

        return new DataCollection(TranslationData::class, $rows);
    }
}
