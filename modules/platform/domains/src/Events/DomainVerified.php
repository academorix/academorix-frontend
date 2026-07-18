<?php

declare(strict_types=1);

namespace Academorix\Domains\Events;

use Academorix\Domains\Models\Domain;
use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when every DomainRecord matches — Domain.verified_at set.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'domains.domain.verified')]
final readonly class DomainVerified implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public Domain $domain)
    {
    }
}
