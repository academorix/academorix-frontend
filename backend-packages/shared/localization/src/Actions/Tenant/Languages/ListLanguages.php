<?php

declare(strict_types=1);

namespace Academorix\Localization\Actions\Tenant\Languages;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Localization\Contracts\Repositories\PlatformLanguageRepositoryInterface;
use Academorix\Localization\Data\Resources\PlatformLanguageData;
use Academorix\Localization\Enums\LocalizationPermission;
use Academorix\Localization\Models\PlatformLanguage;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/languages` — tenant read of the platform-active
 * language catalogue.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsAction(name: 'localization.tenant.languages.list')]
#[Get('/api/v1/languages')]
#[Middleware(['api', 'auth:sanctum', 'locale.resolve'])]
#[RequirePermission(LocalizationPermission::LanguagesViewAny)]
final class ListLanguages
{
    use AsController;

    public function __construct(
        private readonly PlatformLanguageRepositoryInterface $languages,
    ) {
    }

    /**
     * @return DataCollection<int, PlatformLanguageData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->languages
            ->findAllActive()
            ->map(static fn (PlatformLanguage $language): PlatformLanguageData => PlatformLanguageData::fromModel($language));

        return new DataCollection(PlatformLanguageData::class, $rows);
    }
}
