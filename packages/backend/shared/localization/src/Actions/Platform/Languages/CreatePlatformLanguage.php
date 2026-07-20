<?php

declare(strict_types=1);

namespace Academorix\Localization\Actions\Platform\Languages;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Localization\Contracts\Data\PlatformLanguageInterface;
use Academorix\Localization\Contracts\Repositories\PlatformLanguageRepositoryInterface;
use Academorix\Localization\Data\Requests\CreatePlatformLanguageRequestData;
use Academorix\Localization\Data\Resources\PlatformLanguageData;
use Academorix\Localization\Enums\LocalizationPermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;

/**
 * `POST /api/v1/platform/languages` — platform-admin creates a
 * catalogue row.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsAction(name: 'localization.platform.languages.create')]
#[Post('/api/v1/platform/languages')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(LocalizationPermission::PlatformLanguagesCreate)]
final class CreatePlatformLanguage
{
    use AsController;

    public function __construct(
        private readonly PlatformLanguageRepositoryInterface $languages,
    ) {
    }

    public function __invoke(CreatePlatformLanguageRequestData $data): PlatformLanguageData
    {
        $row = $this->languages->create([
            PlatformLanguageInterface::ATTR_BCP47_CODE            => $data->bcp47Code,
            PlatformLanguageInterface::ATTR_GEOGRAPHY_LANGUAGE_ID => $data->geographyLanguageId,
            PlatformLanguageInterface::ATTR_GEOGRAPHY_COUNTRY_ID  => $data->geographyCountryId,
            PlatformLanguageInterface::ATTR_SCRIPT                => $data->script,
            PlatformLanguageInterface::ATTR_IS_PLATFORM_ACTIVE    => $data->isPlatformActive,
            PlatformLanguageInterface::ATTR_IS_BETA               => $data->isBeta,
            PlatformLanguageInterface::ATTR_SORT_ORDER            => $data->sortOrder,
            PlatformLanguageInterface::ATTR_NOTES                 => $data->notes,
        ]);

        return PlatformLanguageData::fromModel($row);
    }
}
