<?php

declare(strict_types=1);

namespace Academorix\Localization\Actions\Tenant\Translations;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Localization\Contracts\Data\TranslationInterface;
use Academorix\Localization\Data\Requests\UpdateTranslationRequestData;
use Academorix\Localization\Data\Resources\TranslationData;
use Academorix\Localization\Enums\LocalizationPermission;
use Academorix\Localization\Models\Translation;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Patch;
use Academorix\Routing\Concerns\AsController;
use Spatie\LaravelData\Optional;

/**
 * `PATCH /api/v1/translations/{translation}` — update the value or
 * verify flag on an existing translation row.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsAction(name: 'localization.tenant.translations.update')]
#[Patch('/api/v1/translations/{translation}')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve', 'locale.resolve'])]
#[RequirePermission(LocalizationPermission::TranslationsUpdate)]
final class UpdateTranslation
{
    use AsController;

    public function __invoke(
        Translation $translation,
        UpdateTranslationRequestData $data,
    ): TranslationData {
        $attributes = [];

        if (! $data->value instanceof Optional) {
            $attributes[TranslationInterface::ATTR_VALUE]  = $data->value;
            $attributes[TranslationInterface::ATTR_IS_STALE] = false;
        }

        if (! $data->isVerified instanceof Optional) {
            $attributes[TranslationInterface::ATTR_IS_VERIFIED] = $data->isVerified;
        }

        $translation->fill($attributes)->save();

        return TranslationData::fromModel($translation);
    }
}
