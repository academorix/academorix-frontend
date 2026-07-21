<?php

declare(strict_types=1);

namespace Stackra\Domains\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Domains\Contracts\Repositories\DomainRepositoryInterface;
use Stackra\Domains\Data\DomainData;
use Stackra\Domains\Enums\DomainsPermission;
use Stackra\Domains\Models\Domain;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/platform/domains` — every domain across every tenant.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsAction(name: 'domains.platform.list')]
#[Get('/api/v1/platform/domains')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(DomainsPermission::View)]
final class ListDomains
{
    use AsController;

    public function __construct(
        private readonly DomainRepositoryInterface $domains,
    ) {
    }

    /**
     * @return DataCollection<int, DomainData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->domains->paginate()
            ->getCollection()
            ->map(static fn (Domain $d): DomainData => DomainData::fromModel($d));

        return new DataCollection(DomainData::class, $rows);
    }
}
