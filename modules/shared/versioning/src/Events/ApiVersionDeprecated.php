<?php

declare(strict_types=1);

namespace Academorix\Versioning\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Versioning\Models\ApiVersion;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when an ApiVersion transitions from `released` to
 * `deprecated`. From this moment the middleware emits the Deprecation
 * + Sunset headers on every response served under the version.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'versioning.api_version.deprecated')]
final readonly class ApiVersionDeprecated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public ApiVersion $apiVersion)
    {
    }
}
