<?php

declare(strict_types=1);

namespace Academorix\Branding\Events;

use Academorix\Branding\Models\Branding;
use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a Branding profile is created.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'branding.branding.created')]
final readonly class BrandingCreated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public Branding $branding)
    {
    }
}
