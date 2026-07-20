<?php

declare(strict_types=1);

/**
 * Request Context Provider.
 *
 * Adds HTTP request information to Sentry errors as tags and
 * structured context data.
 *
 * ## Context Added
 * - Tags: request_method, request_path
 * - Context: url, method, ip, user_agent, request_id
 *
 * ## Octane Safety
 * ✅ Safe — fetches request on each call via `request()` helper.
 *
 * @category Contexts
 *
 * @since    1.0.0
 */

namespace Academorix\Sentry\Contexts;

use Academorix\Sentry\Attributes\AsSentryContext;
use Academorix\Sentry\Contracts\SentryContext;
use Sentry\State\Scope;
use Throwable;

/**
 * Provides HTTP request metadata as Sentry context.
 */
#[AsSentryContext(description: 'Adds HTTP request information to Sentry errors')]
class RequestContext implements SentryContext
{
    public function provide(Scope $scope, ?Throwable $throwable = null): void
    {
        $request = request();

        if (! $request) {
            return;
        }

        // Add request tags
        $scope->setTag('request_method', $request->method());
        $scope->setTag('request_path', $request->path());

        // Add request context
        $scope->setContext('request', [
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'request_id' => $request->header('X-Request-ID'),
        ]);
    }

    public function priority(): int
    {
        return 50;  // Medium priority
    }
}
