<?php

declare(strict_types=1);

namespace Stackra\Localization\Actions\Platform\Languages;

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
 * `GET /api/v1/platform/languages` — platform-admin read of the
 * full language catalogue (including inactive rows).
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsAction(name: 'localization.platform.languages.list')]
#[Get('/api/v1/platform/languages')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(LocalizationPermission::PlatformLanguagesViewAny)]
final class ListPlatformLanguages
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
        $rows = $this->languages->paginate()
            ->getCollection()
            ->map(static fn (PlatformLanguage $lang): PlatformLanguageData => PlatformLanguageData::fromModel($lang));

        return new DataCollection(PlatformLanguageData::class, $rows);
    }
}
