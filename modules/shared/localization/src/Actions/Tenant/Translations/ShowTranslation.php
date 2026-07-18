<?php

declare(strict_types=1);

namespace Academorix\Localization\Actions\Tenant\Translations;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Localization\Data\Resources\TranslationData;
use Academorix\Localization\Enums\LocalizationPermission;
use Academorix\Localization\Models\Translation;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;

/**
 * `GET /api/v1/translations/{translation}` — read one translation
 * row.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsAction(name: 'localization.tenant.translations.show')]
#[Get('/api/v1/translations/{translation}')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve', 'locale.resolve'])]
#[RequirePermission(LocalizationPermission::TranslationsView)]
final class ShowTranslation
{
    use AsController;

    public function __invoke(Translation $translation): TranslationData
    {
        return TranslationData::fromModel($translation);
    }
}
