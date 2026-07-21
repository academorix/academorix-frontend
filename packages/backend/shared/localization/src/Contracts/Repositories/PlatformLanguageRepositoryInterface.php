<?php

declare(strict_types=1);

namespace Stackra\Localization\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Localization\Models\PlatformLanguage;
use Stackra\Localization\Repositories\EloquentPlatformLanguageRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see PlatformLanguage}.
 *
 * Adds catalogue-scoped finders on top of the base CRUD surface.
 * Consumers type-hint the interface so tests can bind a stub.
 *
 * @extends RepositoryInterface<PlatformLanguage>
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Bind(EloquentPlatformLanguageRepository::class)]
interface PlatformLanguageRepositoryInterface extends RepositoryInterface
{
    /**
     * Find the platform-language row for a BCP-47 tag. Match is
     * case-insensitive on the language subtag and case-sensitive on
     * script + region — matching the BCP-47 canonical form.
     *
     * @param  string  $bcp47Code  e.g. `en`, `fr-CA`, `zh-Hant`.
     * @return PlatformLanguage|null  The matching row, or null.
     */
    public function findByBcp47(string $bcp47Code): ?PlatformLanguage;

    /**
     * Every currently active + non-beta row, sorted by `sort_order`.
     *
     * @return Collection<int, PlatformLanguage>
     */
    public function findAllActive(): Collection;

    /**
     * Every row keyed by `bcp47_code` for O(1) lookup — used by the
     * `Accept-Language` resolution strategy.
     *
     * @return Collection<string, PlatformLanguage>
     */
    public function findAllKeyedByCode(): Collection;
}
