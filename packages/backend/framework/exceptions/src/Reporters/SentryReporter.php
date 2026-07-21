<?php

declare(strict_types=1);

namespace Stackra\Exceptions\Reporters;

use Stackra\Exceptions\StackraException;
use Stackra\Exceptions\Contracts\ExceptionReporterInterface;
use Stackra\Exceptions\Support\Redactor;
use Illuminate\Contracts\Container\Container;
use Throwable;

/**
 * Reporter that enriches Sentry scope with Stackra-structured
 * metadata before Sentry's own SDK emits the event.
 *
 * ## SDK availability
 *
 * The reporter is safe to instantiate without `sentry/sentry-laravel`
 * installed — {@see shouldReport()} returns `false` when the SDK
 * global function isn't present, so internal-only apps skip Sentry
 * entirely with no runtime cost.
 *
 * ## What lands in Sentry
 *
 *   - **Tags** — `error.code`, `error.category`, `error.severity`,
 *     `correlation_id`, `tenant_id`, `route`. Sentry indexes tags for
 *     search + alerting.
 *   - **Contexts** — `stackra.error` (full masked exception
 *     snapshot) and `stackra.request` (masked per-request metadata
 *     from the exception-context middleware).
 *
 * The redactor runs on every value before Sentry receives it, so we
 * don't rely on Sentry's own data-scrubbing config for our masking
 * rules.
 *
 * ## Priority
 *
 * Runs at priority `50` — after the local {@see LogReporter}
 * (priority 100), so a broken Sentry SDK doesn't cost us the log
 * line, but before any downstream custom reporters that might read
 * the enriched scope.
 */
final class SentryReporter implements ExceptionReporterInterface
{
    public function __construct(
        private readonly Container $container,
        private readonly Redactor $redactor,
    ) {
    }

    public function shouldReport(Throwable $throwable): bool
    {
        return $this->sentryAvailable();
    }

    public function report(Throwable $throwable): void
    {
        $requestContext = $this->requestContext();

        \Sentry\configureScope(function (\Sentry\State\Scope $scope) use ($throwable, $requestContext): void {
            foreach ($this->tags($throwable, $requestContext) as $key => $value) {
                if ($value !== null && $value !== '') {
                    $scope->setTag($key, (string) $value);
                }
            }

            if ($throwable instanceof StackraException) {
                $scope->setContext(
                    'stackra.error',
                    $this->redactor->redact($throwable->toArray()),
                );

                if ($throwable->correlationId() !== null) {
                    $scope->setTag('correlation_id', $throwable->correlationId());
                }
            }

            if ($requestContext !== []) {
                $scope->setContext(
                    'stackra.request',
                    $this->redactor->redact($requestContext),
                );
            }
        });
    }

    public function priority(): int
    {
        return 50;
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------

    /**
     * Small, high-signal fields Sentry indexes for search + alerting.
     *
     * @param  array<string, mixed>  $requestContext
     * @return array<string, string|null>
     */
    private function tags(Throwable $e, array $requestContext): array
    {
        $tags = [];

        if ($e instanceof StackraException) {
            $tags['error.code'] = $e->errorCode();
            $tags['error.category'] = $e->category()->value;
            $tags['error.severity'] = $e->severity()->value;
        }

        if (isset($requestContext['tenant_id'])) {
            $tags['tenant_id'] = (string) $requestContext['tenant_id'];
        }

        if (isset($requestContext['route'])) {
            $tags['route'] = (string) $requestContext['route'];
        }

        return $tags;
    }

    /**
     * @return array<string, mixed>
     */
    private function requestContext(): array
    {
        if (! $this->container->bound('stackra.exception_context')) {
            return [];
        }

        $context = $this->container->make('stackra.exception_context');

        return is_array($context) ? $context : [];
    }

    /**
     * Cheap probe — Sentry SDK is optional. When absent, the
     * reporter is a no-op.
     */
    private function sentryAvailable(): bool
    {
        return function_exists('\\Sentry\\configureScope');
    }
}
