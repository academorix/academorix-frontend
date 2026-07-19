<?php

declare(strict_types=1);

namespace Academorix\Localization\Actions\Tenant\Translations;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Localization\Enums\LocalizationPermission;
use Academorix\Localization\Models\Translation;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Delete;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
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
