<?php

declare(strict_types=1);

namespace Academorix\Localization\Actions\Tenant\Languages;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Localization\Data\Resources\PlatformLanguageData;
use Academorix\Localization\Enums\LocalizationPermission;
use Academorix\Localization\Models\PlatformLanguage;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;

/**
 * `GET /api/v1/languages/{language}` — tenant read of one
 * platform-language row.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsAction(name: 'localization.tenant.languages.show')]
#[Get('/api/v1/languages/{language}')]
#[Middleware(['api', 'auth:sanctum', 'locale.resolve'])]
#[RequirePermission(LocalizationPermission::LanguagesView)]
final class ShowLanguage
{
    use AsController;

    public function __invoke(PlatformLanguage $language): PlatformLanguageData
    {
        return PlatformLanguageData::fromModel($language);
    }
}
