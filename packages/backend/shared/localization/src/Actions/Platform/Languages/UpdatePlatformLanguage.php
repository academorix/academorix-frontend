<?php

declare(strict_types=1);

namespace Stackra\Localization\Actions\Platform\Languages;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Localization\Contracts\Data\PlatformLanguageInterface;
use Stackra\Localization\Data\Requests\UpdatePlatformLanguageRequestData;
use Stackra\Localization\Data\Resources\PlatformLanguageData;
use Stackra\Localization\Enums\LocalizationPermission;
use Stackra\Localization\Models\PlatformLanguage;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Patch;
use Stackra\Routing\Concerns\AsController;
use Spatie\LaravelData\Optional;

/**
 * `PATCH /api/v1/platform/languages/{language}` — platform-admin
 * update.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsAction(name: 'localization.platform.languages.update')]
#[Patch('/api/v1/platform/languages/{language}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(LocalizationPermission::PlatformLanguagesUpdate)]
final class UpdatePlatformLanguage
{
    use AsController;

    public function __invoke(
        PlatformLanguage $language,
        UpdatePlatformLanguageRequestData $data,
    ): PlatformLanguageData {
        $attributes = [];

        if (! $data->script instanceof Optional) {
            $attributes[PlatformLanguageInterface::ATTR_SCRIPT] = $data->script;
        }

        if (! $data->isPlatformActive instanceof Optional) {
            $attributes[PlatformLanguageInterface::ATTR_IS_PLATFORM_ACTIVE] = $data->isPlatformActive;
        }

        if (! $data->isBeta instanceof Optional) {
            $attributes[PlatformLanguageInterface::ATTR_IS_BETA] = $data->isBeta;
        }

        if (! $data->sortOrder instanceof Optional) {
            $attributes[PlatformLanguageInterface::ATTR_SORT_ORDER] = $data->sortOrder;
        }

        if (! $data->notes instanceof Optional) {
            $attributes[PlatformLanguageInterface::ATTR_NOTES] = $data->notes;
        }

        $language->fill($attributes)->save();

        return PlatformLanguageData::fromModel($language);
    }
}
