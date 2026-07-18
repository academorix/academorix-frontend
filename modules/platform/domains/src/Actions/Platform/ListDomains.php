<?php

declare(strict_types=1);

namespace Academorix\Domains\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Domains\Contracts\Repositories\DomainRepositoryInterface;
use Academorix\Domains\Data\DomainData;
use Academorix\Domains\Enums\DomainsPermission;
use Academorix\Domains\Models\Domain;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
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
