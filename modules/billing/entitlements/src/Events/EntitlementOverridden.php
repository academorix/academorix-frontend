<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Events;

use Academorix\Entitlements\Models\Entitlement;
use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a platform admin manually overrides an
 * entitlement's `value`.
 *
 * Every override produces a compliance audit row via the wrapping
 * listener — enterprise contract negotiations must be traceable.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'entitlements.entitlement.overridden')]
final readonly class EntitlementOverridden implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  array<string, mixed>  $oldValue  Value before the override.
     * @param  array<string, mixed>  $newValue  Value after the override.
     */
    public function __construct(
        public Entitlement $entitlement,
        public array $oldValue,
        public array $newValue,
        public ?string $notes = null,
    ) {
    }
}
