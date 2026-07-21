<?php

declare(strict_types=1);

namespace Stackra\Localization\Jobs;

use Stackra\Localization\Contracts\Data\TranslationInterface;
use Stackra\Localization\Contracts\Repositories\TranslationRepositoryInterface;
use Stackra\Localization\Contracts\Services\TranslationCacheInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Pre-populate the translation cache with the tenant's hot rows.
 *
 * Loads every Translation for the caller's tenant + locale +
 * namespace and populates the cache under each `(namespace, group,
 * key)` triple. Bounded by the passed-in row limit so a single
 * warm run can't drown the cache.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Queue('translations')]
#[Timeout(600)]
#[Tries(2)]
final class WarmTranslationCacheJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  string|null  $tenantId   Owning tenant (null for platform-default warm).
     * @param  string       $localeCode BCP-47 tag.
     * @param  string|null  $namespace  Optional namespace filter.
     * @param  int          $limit      Row cap.
     */
    public function __construct(
        public readonly ?string $tenantId,
        public readonly string $localeCode,
        public readonly ?string $namespace = null,
        public readonly int $limit = 500,
    ) {
    }

    public function handle(
        TranslationRepositoryInterface $translations,
        TranslationCacheInterface $cache,
    ): void {
        $query = $translations->query()
            ->where(TranslationInterface::ATTR_LOCALE_CODE, $this->localeCode);

        if ($this->tenantId !== null) {
            $query->where(TranslationInterface::ATTR_TENANT_ID, $this->tenantId);
        } else {
            $query->whereNull(TranslationInterface::ATTR_TENANT_ID);
        }

        if ($this->namespace !== null) {
            $query->where(TranslationInterface::ATTR_NAMESPACE, $this->namespace);
        }

        $rows = $query->limit($this->limit)->get();

        foreach ($rows as $row) {
            $cache->put(
                $this->tenantId,
                $this->localeCode,
                (string) $row->{TranslationInterface::ATTR_NAMESPACE},
                (string) $row->{TranslationInterface::ATTR_GROUP},
                (string) $row->{TranslationInterface::ATTR_KEY},
                (string) $row->{TranslationInterface::ATTR_VALUE},
            );
        }
    }

    public function failed(\Throwable $e): void
    {
        // No-op — a cache-warm failure is diagnostic, not user-facing.
    }
}
