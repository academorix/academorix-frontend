<?php

declare(strict_types=1);

namespace Academorix\Versioning\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Versioning\Models\ApiVersion;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when an ApiVersion transitions from `draft` to
 * `released`. Consumers listen to invalidate catalog caches, notify
 * subscribers, and mark the version as publicly targetable.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'versioning.api_version.released')]
final readonly class ApiVersionReleased implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public ApiVersion $apiVersion)
    {
    }
}
