<?php

declare(strict_types=1);

namespace Academorix\Localization\Actions\Platform\Languages;

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
