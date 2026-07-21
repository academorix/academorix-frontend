<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Newsletter\Contracts\Data\NewsletterInterface;
use Stackra\Newsletter\Contracts\Repositories\NewsletterRepositoryInterface;
use Stackra\Newsletter\Data\NewsletterData;
use Stackra\Newsletter\Enums\NewsletterPermission;
use Stackra\Newsletter\Models\Newsletter;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/newsletters` — list newsletters within the tenant.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletters.list')]
#[Get('/api/v1/newsletters')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NewsletterPermission::NewslettersViewAny)]
final class ListNewsletters
{
    use AsController;

    public function __construct(
        private readonly NewsletterRepositoryInterface $newsletters,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    /**
     * @return DataCollection<int, NewsletterData>
     */
    public function __invoke(): DataCollection
    {
        $tenant   = $this->tenantContext->currentOrFail();
        $tenantId = (string) $tenant->getKey();

        $rows = Newsletter::query()
            ->where(NewsletterInterface::ATTR_TENANT_ID, $tenantId)
            ->orderByDesc(NewsletterInterface::ATTR_CREATED_AT)
            ->get()
            ->map(static fn (Newsletter $n): NewsletterData => NewsletterData::fromModel($n));

        return new DataCollection(NewsletterData::class, $rows);
    }
}
