<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Newsletter\Contracts\Data\NewsletterInterface;
use Academorix\Newsletter\Contracts\Repositories\NewsletterRepositoryInterface;
use Academorix\Newsletter\Data\NewsletterData;
use Academorix\Newsletter\Enums\NewsletterPermission;
use Academorix\Newsletter\Models\Newsletter;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
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
