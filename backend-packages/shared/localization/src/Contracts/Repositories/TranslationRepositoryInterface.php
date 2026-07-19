<?php

declare(strict_types=1);

namespace Academorix\Localization\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Localization\Models\Translation;
use Academorix\Localization\Repositories\EloquentTranslationRepository;
use DateTimeInterface;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see Translation}.
 *
 * Adds the hot-path resolver finders + retention purge on top of
 * the base CRUD surface.
 *
 * @extends RepositoryInterface<Translation>
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Bind(EloquentTranslationRepository::class)]
interface TranslationRepositoryInterface extends RepositoryInterface
{
    /**
     * Resolve a translation for the passed composite key.
     *
     * Tries the tenant override first (`tenant_id = $tenantId`),
     * then the platform default (`tenant_id IS NULL`). Matches
     * against the DENORMALISED `locale_code` column so no join is
     * needed on the hot path.
     *
     * @param  string|null  $tenantId    Tenant id, or null for platform-default lookup.
     * @param  string       $localeCode  BCP-47 tag.
     * @param  string       $namespace   Namespace bucket (`*` = default).
     * @param  string       $group       Group name (e.g. `messages`).
     * @param  string       $key         Translation key.
     * @return Translation|null  The matching row, or null.
     */
    public function findResolved(
        ?string $tenantId,
        string $localeCode,
        string $namespace,
        string $group,
        string $key,
    ): ?Translation;

    /**
     * Every translation row for a `(tenant, locale, namespace,
     * group)` tuple — used by the cache-warming job to preload the
     * hot set.
     *
     * @param  string|null  $tenantId    Tenant id, or null for platform-default rows.
     * @param  string       $localeCode  BCP-47 tag.
     * @param  string       $namespace   Namespace bucket.
     * @param  string       $group       Group name.
     * @return Collection<int, Translation>
     */
    public function findGroup(
        ?string $tenantId,
        string $localeCode,
        string $namespace,
        string $group,
    ): Collection;

    /**
     * Hard-delete rows past the retention window.
     *
     * @param  DateTimeInterface  $cutoff  Rows updated before this are purged.
     * @return int  Number of rows deleted.
     */
    public function pruneStaleOlderThan(DateTimeInterface $cutoff): int;
}
