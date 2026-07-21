<?php

declare(strict_types=1);

namespace Stackra\Versioning\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Versioning\Models\ApiVersion;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when an ApiVersion transitions from `deprecated` to
 * `sunset`. Consumers listen to auto-disable pinned webhook
 * subscriptions and to notify affected tenants of the final cutover.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'versioning.api_version.sunset')]
final readonly class ApiVersionSunset implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public ApiVersion $apiVersion)
    {
    }
}
