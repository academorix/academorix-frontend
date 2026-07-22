<?php

declare(strict_types=1);

namespace Stackra\Localization\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Localization\Contracts\Repositories\TranslationRepositoryInterface;
use Stackra\Localization\Data\Resources\TranslationData;
use Stackra\Localization\Enums\LocalizationPermission;
use Stackra\Localization\Models\Translation;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/platform/translations` — platform-admin cross-tenant
 * read of translations for observability + incident triage.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsAction(name: 'localization.platform.translations.list')]
#[Get('/api/v1/platform/translations')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(LocalizationPermission::PlatformTranslationsViewAny)]
final class ListPlatformTranslations
{
    use AsController;

    public function __construct(
        private readonly TranslationRepositoryInterface $translations,
    ) {
    }

    /**
     * @return DataCollection<int, TranslationData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->translations
            ->paginate()
            ->getCollection()
            ->map(static fn (Translation $row): TranslationData => TranslationData::fromModel($row));

        return new DataCollection(TranslationData::class, $rows);
    }
}
