<?php

declare(strict_types=1);

namespace Stackra\Geography\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Geography\Contracts\Data\LanguageInterface;
use Stackra\Geography\Contracts\Repositories\LanguageRepositoryInterface;
use Stackra\Geography\Data\Requests\CreateLanguageRequestData;
use Stackra\Geography\Data\Resources\LanguageResourceData;
use Stackra\Geography\Enums\GeographyPermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;

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
