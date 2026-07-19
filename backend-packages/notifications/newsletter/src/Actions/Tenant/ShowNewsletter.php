<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Newsletter\Contracts\Repositories\NewsletterRepositoryInterface;
use Academorix\Newsletter\Data\NewsletterData;
use Academorix\Newsletter\Enums\NewsletterPermission;
use Academorix\Newsletter\Exceptions\NewsletterNotFoundException;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;

/**
 * `GET /api/v1/newsletters/{newsletter}` — show a single newsletter.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletters.show')]
#[Get('/api/v1/newsletters/{newsletter}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NewsletterPermission::NewslettersView)]
final class ShowNewsletter
{
    use AsController;

    public function __construct(
        private readonly NewsletterRepositoryInterface $newsletters,
    ) {
    }

    public function __invoke(string $newsletter): NewsletterData
    {
        $model = $this->newsletters->find($newsletter);
        if ($model === null) {
            throw new NewsletterNotFoundException('Newsletter not found.');
        }

        return NewsletterData::fromModel($model);
    }
}
