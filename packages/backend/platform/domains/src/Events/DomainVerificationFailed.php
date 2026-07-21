<?php

declare(strict_types=1);

namespace Stackra\Domains\Events;

use Stackra\Domains\Models\Domain;
use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched once when `verification_attempts` hits the cap without
 * every record matching.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'domains.domain.verification_failed')]
final readonly class DomainVerificationFailed implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public Domain $domain,
        public string $lastError,
    ) {
    }
}
