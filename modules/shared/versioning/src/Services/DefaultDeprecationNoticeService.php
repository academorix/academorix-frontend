<?php

declare(strict_types=1);

namespace Academorix\Versioning\Services;

use Academorix\Versioning\Contracts\Data\ApiVersionInterface;
use Academorix\Versioning\Contracts\Data\DeprecationNoticeInterface;
use Academorix\Versioning\Contracts\Repositories\ApiVersionRepositoryInterface;
use Academorix\Versioning\Contracts\Repositories\DeprecationNoticeRepositoryInterface;
use Academorix\Versioning\Contracts\Services\DeprecationNoticeServiceInterface;
use Academorix\Versioning\Events\DeprecationNoticePublished;
use Academorix\Versioning\Models\DeprecationNotice;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Support\Collection;

/**
 * Default {@see DeprecationNoticeServiceInterface} implementation.
 *
 * `#[Scoped]` — the service reads active notices per-request via the
 * repository, and the memoisation window is a request.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultDeprecationNoticeService implements DeprecationNoticeServiceInterface
{
    public function __construct(
        private readonly DeprecationNoticeRepositoryInterface $notices,
        private readonly ApiVersionRepositoryInterface $versions,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function publish(DeprecationNotice $notice): void
    {
        $notice->update([
            DeprecationNoticeInterface::ATTR_IS_ACTIVE => true,
            DeprecationNoticeInterface::ATTR_STARTS_AT => $notice->{DeprecationNoticeInterface::ATTR_STARTS_AT}
                ?? \now(),
        ]);

        DeprecationNoticePublished::dispatch($notice->refresh());
    }

    /**
     * {@inheritDoc}
     */
    public function activeFor(string $apiVersionSlug): Collection
    {
        $version = $this->versions->findBySlug($apiVersionSlug);
        if ($version === null) {
            /** @var Collection<int, DeprecationNotice> $empty */
            $empty = new Collection();

            return $empty;
        }

        return $this->notices->findByVersion((string) $version->{ApiVersionInterface::ATTR_ID})
            ->filter(static fn (DeprecationNotice $n): bool => $n->isCurrentlyActive())
            ->values();
    }
}
