<?php

declare(strict_types=1);

namespace Stackra\Localization\Actions\Tenant\Translations;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Localization\Enums\LocalizationPermission;
use Stackra\Localization\Models\Translation;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Delete;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;

/**
 * `DELETE /api/v1/translations/{translation}` — delete a tenant
 * translation override. The resolution falls back to the platform
 * default or the file-based translation.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsAction(name: 'localization.tenant.translations.delete')]
#[Delete('/api/v1/translations/{translation}')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve', 'locale.resolve'])]
#[RequirePermission(LocalizationPermission::TranslationsDelete)]
final class DeleteTranslation
{
    use AsController;

    public function __invoke(Translation $translation): JsonResponse
    {
        $translation->delete();

        return new JsonResponse([], JsonResponse::HTTP_NO_CONTENT);
    }
}
