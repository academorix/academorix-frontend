<?php

declare(strict_types=1);

namespace Stackra\Geography\Actions\Languages;

use Stackra\Geography\Contracts\Repositories\LanguageRepositoryInterface;
use Stackra\Geography\Data\Resources\LanguageResourceData;
use Stackra\Geography\Models\Language;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
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
