<?php

declare(strict_types=1);

namespace Stackra\Localization\Actions\Tenant\Languages;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Localization\Data\Resources\PlatformLanguageData;
use Stackra\Localization\Enums\LocalizationPermission;
use Stackra\Localization\Models\PlatformLanguage;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;

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
