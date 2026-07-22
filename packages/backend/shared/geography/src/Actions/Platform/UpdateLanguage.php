<?php

declare(strict_types=1);

namespace Stackra\Geography\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Geography\Contracts\Repositories\LanguageRepositoryInterface;
use Stackra\Geography\Data\Requests\UpdateLanguageRequestData;
use Stackra\Geography\Data\Resources\LanguageResourceData;
use Stackra\Geography\Enums\GeographyPermission;
use Stackra\Geography\Models\Language;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Patch;
use Stackra\Routing\Concerns\AsController;

/**
 * `PATCH /api/v1/platform/geography/languages/{language}` — platform
 * admin updates a language row.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.platform.languages.update')]
#[Patch('/api/v1/platform/geography/languages/{language}')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:foundation-platform', 'world.locale'])]
#[RequirePermission(GeographyPermission::PlatformManage)]
final class UpdateLanguage
{
    use AsController;

    public function __construct(
        private readonly LanguageRepositoryInterface $languages,
    ) {
    }

    public function __invoke(Language $language, UpdateLanguageRequestData $data): LanguageResourceData
    {
        $updated = $this->languages->update((string) $language->getKey(), $data->toArray());

        return LanguageResourceData::fromModel($updated);
    }
}
