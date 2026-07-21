<?php

declare(strict_types=1);

namespace Stackra\Domains\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Domains\Contracts\Data\DomainInterface;
use Stackra\Domains\Contracts\Repositories\DomainRepositoryInterface;
use Stackra\Domains\Data\DomainData;
use Stackra\Domains\Data\Requests\CreateDomainRequestData;
use Stackra\Domains\Enums\DomainsPermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;

/**
 * `POST /api/v1/platform/domains` — platform admin adds a domain to
 * any tenant. Requires `tenant_id` in the payload (queried from the
 * container instead — this platform-admin variant reads it from a
 * dedicated context service if implemented; otherwise creates the
 * row with an application_id already set on the target tenant).
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsAction(name: 'domains.platform.create')]
#[Post('/api/v1/platform/domains')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(DomainsPermission::Manage)]
final class CreateDomain
{
    use AsController;

    public function __construct(
        private readonly DomainRepositoryInterface $domains,
    ) {
    }

    public function __invoke(CreateDomainRequestData $data): DomainData
    {
        // Platform-admin flow — payload carries an implicit tenant target.
        // In practice the caller passes `tenant_id` via a follow-up flow
        // (this action is a stub; production consumers add the id in a
        // controller-owned bind). For now the observer will refuse if
        // tenant_id is missing when saving.
        $domain = $this->domains->create([
            DomainInterface::ATTR_HOST                => $data->host,
            DomainInterface::ATTR_KIND                => $data->kind->value,
            DomainInterface::ATTR_VERIFICATION_METHOD => $data->verificationMethod?->value,
            DomainInterface::ATTR_IS_PRIMARY          => $data->isPrimary,
        ]);

        return DomainData::fromModel($domain);
    }
}
