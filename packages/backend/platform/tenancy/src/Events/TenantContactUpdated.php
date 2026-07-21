<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Tenancy\Models\TenantContact;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a {@see TenantContact} is updated.
 *
 * Also fires whenever `verified_at` transitions from null → not-null.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'tenancy.contact.updated')]
final readonly class TenantContactUpdated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  TenantContact      $contact  The updated contact.
     * @param  array<int,string>  $dirty    Column names that changed.
     */
    public function __construct(
        public TenantContact $contact,
        public array $dirty,
    ) {
    }
}
