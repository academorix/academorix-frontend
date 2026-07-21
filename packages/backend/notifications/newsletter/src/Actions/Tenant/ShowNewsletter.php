<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Newsletter\Contracts\Repositories\NewsletterRepositoryInterface;
use Stackra\Newsletter\Data\NewsletterData;
use Stackra\Newsletter\Enums\NewsletterPermission;
use Stackra\Newsletter\Exceptions\NewsletterNotFoundException;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;

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
