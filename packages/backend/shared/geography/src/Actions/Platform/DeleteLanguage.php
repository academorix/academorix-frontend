<?php

declare(strict_types=1);

namespace Stackra\Geography\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Geography\Contracts\Repositories\LanguageRepositoryInterface;
use Stackra\Geography\Enums\GeographyPermission;
use Stackra\Geography\Models\Language;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Delete;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;

/**
 * `DELETE /api/v1/platform/geography/languages/{language}` — platform
 * admin deletes a language row.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.platform.languages.delete')]
#[Delete('/api/v1/platform/geography/languages/{language}')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:foundation-platform', 'world.locale'])]
#[RequirePermission(GeographyPermission::PlatformManage)]
final class DeleteLanguage
{
    use AsController;

    public function __construct(
        private readonly LanguageRepositoryInterface $languages,
    ) {
    }

    public function __invoke(Language $language): JsonResponse
    {
        $this->languages->delete((string) $language->getKey());

        return \response()->json([], JsonResponse::HTTP_NO_CONTENT);
    }
}
