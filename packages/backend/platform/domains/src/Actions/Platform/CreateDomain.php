<?php

declare(strict_types=1);

namespace Academorix\Domains\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Domains\Contracts\Data\DomainInterface;
use Academorix\Domains\Contracts\Repositories\DomainRepositoryInterface;
use Academorix\Domains\Data\DomainData;
use Academorix\Domains\Data\Requests\CreateDomainRequestData;
use Academorix\Domains\Enums\DomainsPermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;

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
