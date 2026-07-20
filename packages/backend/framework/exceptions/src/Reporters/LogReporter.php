<?php

declare(strict_types=1);

namespace Academorix\Exceptions\Reporters;

use Academorix\Exceptions\AcademorixException;
use Academorix\Exceptions\Contracts\ExceptionReporterInterface;
use Academorix\Exceptions\Enums\ErrorCategory;
use Academorix\Exceptions\Support\ExceptionMapper;
use Academorix\Exceptions\Support\Redactor;
use Academorix\Exceptions\Support\TraceCleaner;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Illuminate\Contracts\Container\Container;
use Illuminate\Log\LogManager;
use Psr\Log\LoggerInterface;
use Throwable;

/**
 * Structured log reporter. Writes a JSON-shaped log line per reported
 * exception at the PSR-3 level derived from the exception's declared
 * severity, routed to the log channel configured for its category.
 *
 * ## Design goals
 *
 *   1. **Correct severity** — a 401 logs at `warning`, a 500 at
 *      `error`, an infrastructure emergency at `emergency`. Never
 *      blanket-`error` the way Laravel's default does.
 *
 *   2. **Structured payload** — the `context` array carries
 *      `error_code`, `category`, `severity`, `correlation_id`,
 *      `retry_after`, plus the exception's own `context()` metadata,
 *      the request context stashed by
 *      {@see \Academorix\Exceptions\Middleware\CaptureExceptionContext},
 *      and a cleaned stack trace.
 *
 *   3. **Masked** — everything runs through the {@see Redactor} +
 *      {@see TraceCleaner} pair before hitting disk.
 *
 *   4. **Category-routed channels** — security events land in a
 *      dedicated channel for audit, integration failures in an
 *      upstream channel for SRE. Route table lives in
 *      `exceptions.log.channels`.
 *
 * ## Priority
 *
 * Runs at priority `100` — before external reporters (Sentry, Slack)
 * so a broken external service can't rob us of a local log line.
 */
final class LogReporter implements ExceptionReporterInterface
{
    /**
     * Fallback category → channel map when config doesn't override.
     * Values must reference channels declared in the host app's
     * `config/logging.php`; missing channels quietly fall back to
     * the manager's default channel.
     *
     * @var array<string, string|null>
     */
    private const DEFAULT_CHANNELS = [
        'security' => 'security',
        'tenancy' => 'security',
        'integration' => 'upstream',
        'infrastructure' => 'daily',
    ];

    public function __construct(
        private readonly Container $container,
        private readonly ExceptionMapper $mapper,
        private readonly Redactor $redactor,
        private readonly TraceCleaner $traceCleaner,
    ) {
    }

    public function shouldReport(Throwable $throwable): bool
    {
        // Framework `dontReport` handles the coarse skip list; we
        // still respect per-exception opt-outs where a subclass
        // returns `false` from its `report()` hook.
        if ($throwable instanceof AcademorixException) {
            return $throwable->report() !== false;
        }

        return true;
    }

    public function report(Throwable $throwable): void
    {
        $mapped = $this->mapper->map($throwable);
        $logger = $this->resolveLogger($mapped);

        $logger->log(
            $mapped->severity()->psr(),
            $this->redactor->redactString($mapped->getMessage()),
            $this->buildContext($mapped, $throwable),
        );
    }

    public function priority(): int
    {
        return 100;
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------

    /**
     * Look up the target channel for this exception's category, then
     * resolve the concrete PSR-3 logger from the log manager. Falls
     * back to the manager's default channel when the configured
     * channel isn't declared in the host app.
     */
    private function resolveLogger(AcademorixException $e): LoggerInterface
    {
        /** @var LogManager $manager */
        $manager = $this->container->make('log');
        $channel = $this->channelFor($e->category());

        if ($channel === null) {
            return $manager;
        }

        try {
            return $manager->channel($channel);
        } catch (Throwable) {
            return $manager;
        }
    }

    /**
     * Assemble the structured `context` array logged alongside the
     * message. Every value is either a scalar, a masked array, or a
     * cleaned trace — nothing raw reaches disk.
     *
     * @return array<string, mixed>
     */
    private function buildContext(AcademorixException $mapped, Throwable $original): array
    {
        return [
            'error_code' => $mapped->errorCode(),
            'error_category' => $mapped->category()->value,
            'error_severity' => $mapped->severity()->value,
            'http_status' => $mapped->httpStatus(),
            'correlation_id' => $mapped->correlationId(),
            'retry_after' => $mapped->retryAfter(),
            'origin_class' => $original::class,
            'context' => $this->redactor->redact($mapped->context()),
            'request' => $this->redactor->redact($this->requestContext()),
            'trace' => $this->traceCleaner->clean($original),
            'previous' => $original->getPrevious() !== null
                ? $this->traceCleaner->describe($original->getPrevious())
                : null,
        ];
    }

    /**
     * Read the category → channel override map from config, falling
     * back to {@see DEFAULT_CHANNELS} when no override exists.
     */
    private function channelFor(ErrorCategory $category): ?string
    {
        $config = $this->config();
        $overrides = $config?->get('exceptions.log.channels', []) ?? [];

        if (is_array($overrides) && array_key_exists($category->value, $overrides)) {
            $value = $overrides[$category->value];

            return is_string($value) && $value !== '' ? $value : null;
        }

        return self::DEFAULT_CHANNELS[$category->value] ?? null;
    }

    /**
     * Snapshot of per-request metadata (route, method, user id,
     * tenant id, correlation id) captured by the exception-context
     * middleware. Empty when the middleware isn't in the pipeline
     * (queue workers, artisan commands).
     *
     * @return array<string, mixed>
     */
    private function requestContext(): array
    {
        if (! $this->container->bound('academorix.exception_context')) {
            return [];
        }

        $context = $this->container->make('academorix.exception_context');

        return is_array($context) ? $context : [];
    }

    private function config(): ?ConfigRepository
    {
        if (! $this->container->bound('config')) {
            return null;
        }

        $config = $this->container->make('config');

        return $config instanceof ConfigRepository ? $config : null;
    }
}
