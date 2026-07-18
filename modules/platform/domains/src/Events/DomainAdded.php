<?php

declare(strict_types=1);

namespace Academorix\Domains\Events;

use Academorix\Domains\Models\Domain;
use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a Domain row is created.
 *
 * The observer generates the verification token BEFORE this event
 * fires, so listeners see a fully-populated row (with expected DNS
 * records already seeded).
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'domains.domain.added')]
final readonly class DomainAdded implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public Domain $domain)
    {
    }
}
