<?php

declare(strict_types=1);

namespace Stackra\Geography\Actions\Languages;

use Stackra\Geography\Data\Resources\LanguageResourceData;
use Stackra\Geography\Models\Language;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;

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
