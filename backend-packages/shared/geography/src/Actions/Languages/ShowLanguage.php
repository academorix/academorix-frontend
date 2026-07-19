<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\Languages;

use Academorix\Geography\Data\Resources\LanguageResourceData;
use Academorix\Geography\Models\Language;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;

/**
 * `GET /api/v1/geography/languages/{language}` — public language show.
 * Route binding accepts numeric PK OR ISO-639-1 code.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.languages.show')]
#[Get('/api/v1/geography/languages/{language}')]
#[Middleware(['api', 'world.locale', 'geography.cache'])]
final class ShowLanguage
{
    use AsController;

    public function __invoke(Language $language): LanguageResourceData
    {
        return LanguageResourceData::fromModel($language);
    }
}
