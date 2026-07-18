<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\Languages;

use Academorix\Geography\Contracts\Repositories\LanguageRepositoryInterface;
use Academorix\Geography\Data\Resources\LanguageResourceData;
use Academorix\Geography\Models\Language;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/geography/languages` — public list of ISO-639-1
 * languages.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.languages.list')]
#[Get('/api/v1/geography/languages')]
#[Middleware(['api', 'world.locale', 'geography.cache'])]
final class ListLanguages
{
    use AsController;

    public function __construct(
        private readonly LanguageRepositoryInterface $languages,
    ) {
    }

    /**
     * @return DataCollection<int, LanguageResourceData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->languages->all()
            ->map(static fn (Language $l): LanguageResourceData => LanguageResourceData::fromModel($l));

        return new DataCollection(LanguageResourceData::class, $rows);
    }
}
