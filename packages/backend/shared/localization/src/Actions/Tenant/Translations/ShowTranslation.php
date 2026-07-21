<?php

declare(strict_types=1);

namespace Stackra\Localization\Actions\Tenant\Translations;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Localization\Data\Resources\TranslationData;
use Stackra\Localization\Enums\LocalizationPermission;
use Stackra\Localization\Models\Translation;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;

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
