<?php

declare(strict_types=1);

namespace Stackra\Localization\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Localization\Contracts\Repositories\PlatformLanguageRepositoryInterface;
use Stackra\Localization\Data\Resources\PlatformLanguageData;
use Stackra\Localization\Enums\LocalizationPermission;
use Stackra\Localization\Models\PlatformLanguage;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
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
