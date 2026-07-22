<?php

declare(strict_types=1);

namespace Stackra\Localization\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Localization\Contracts\Data\TranslationInterface;
use Stackra\Localization\Data\Requests\UpdateTranslationRequestData;
use Stackra\Localization\Data\Resources\TranslationData;
use Stackra\Localization\Enums\LocalizationPermission;
use Stackra\Localization\Models\Translation;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Patch;
use Stackra\Routing\Concerns\AsController;
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
