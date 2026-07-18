<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\Platform\Languages;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Geography\Contracts\Data\LanguageInterface;
use Academorix\Geography\Contracts\Repositories\LanguageRepositoryInterface;
use Academorix\Geography\Data\Requests\CreateLanguageRequestData;
use Academorix\Geography\Data\Resources\LanguageResourceData;
use Academorix\Geography\Enums\GeographyPermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;

/**
 * `POST /api/v1/platform/geography/languages` — platform admin
 * creates a language row.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.platform.languages.create')]
#[Post('/api/v1/platform/geography/languages')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:foundation-platform', 'world.locale'])]
#[RequirePermission(GeographyPermission::PlatformManage)]
final class CreateLanguage
{
    use AsController;

    public function __construct(
        private readonly LanguageRepositoryInterface $languages,
    ) {
    }

    public function __invoke(CreateLanguageRequestData $data): LanguageResourceData
    {
        $language = $this->languages->create([
            LanguageInterface::ATTR_CODE       => $data->code,
            LanguageInterface::ATTR_NAME       => $data->name,
            LanguageInterface::ATTR_COUNTRY_ID => $data->countryId,
            LanguageInterface::ATTR_NATIVE     => $data->native,
            LanguageInterface::ATTR_DIR        => $data->dir,
            LanguageInterface::ATTR_IS_RTL     => $data->isRtl,
        ]);

        return LanguageResourceData::fromModel($language);
    }
}
