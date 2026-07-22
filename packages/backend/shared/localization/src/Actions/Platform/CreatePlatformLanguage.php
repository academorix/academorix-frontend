<?php

declare(strict_types=1);

namespace Stackra\Localization\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Localization\Contracts\Data\PlatformLanguageInterface;
use Stackra\Localization\Contracts\Repositories\PlatformLanguageRepositoryInterface;
use Stackra\Localization\Data\Requests\CreatePlatformLanguageRequestData;
use Stackra\Localization\Data\Resources\PlatformLanguageData;
use Stackra\Localization\Enums\LocalizationPermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;

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
