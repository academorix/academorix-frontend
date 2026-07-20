<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\Platform\Languages;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Geography\Contracts\Repositories\LanguageRepositoryInterface;
use Academorix\Geography\Data\Requests\UpdateLanguageRequestData;
use Academorix\Geography\Data\Resources\LanguageResourceData;
use Academorix\Geography\Enums\GeographyPermission;
use Academorix\Geography\Models\Language;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Patch;
use Academorix\Routing\Concerns\AsController;

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
