<?php

/**
 * @file packages/exceptions/tests/Unit/LogReporterTest.php
 *
 * @description
 * Unit coverage for {@see \Stackra\Exceptions\Reporters\LogReporter},
 * the structured-log reporter that writes one JSON-shaped log line per
 * exception at the PSR-3 level derived from the exception's declared
 * severity.
 *
 * ## What these tests protect
 *
 *   1. **`shouldReport()`** — respects the framework opt-out via a
 *      subclass `report()` returning `false`; otherwise the reporter
 *      fires.
 *
 *   2. **Correct PSR-3 level** — severity `Info` → PSR-3 `info`,
 *      severity `Error` / `Critical` → `error` / `critical`. The
 *      reporter must not blanket-`error` the way Laravel's default
 *      does.
 *
 *   3. **Category-routed channels** — security-category events land
 *      in the `security` channel; tenancy joins them; integration
 *      goes to `upstream`; infrastructure to `daily`. Anything else
 *      hits the default channel.
 *
 *   4. **Payload shape** — the reporter's context array carries the
 *      documented keys (`error_code`, `error_category`,
 *      `error_severity`, `correlation_id`, `retry_after`, plus the
 *      exception's own context, request snapshot, cleaned trace).
 *
 *   5. **Redaction** — every value goes through the Redactor before
 *      hitting the logger.
 *
 * ## Why Testbench
 *
 * The reporter resolves the `log` manager from the container.
 * Testbench boots the minimal app so `Log::channel(...)` works.
 */

declare(strict_types=1);

use Stackra\Exceptions\Exception;
use Stackra\Exceptions\Auth\ForbiddenException;
use Stackra\Exceptions\Domain\TenantException;
use Stackra\Exceptions\Enums\ErrorCategory;
use Stackra\Exceptions\Enums\ErrorSeverity;
use Stackra\Exceptions\Infrastructure\IntegrationException;
use Stackra\Exceptions\Reporters\LogReporter;
use Stackra\Exceptions\Support\ExceptionMapper;
use Stackra\Exceptions\Support\Redactor;
use Stackra\Exceptions\Support\TraceCleaner;
use Orchestra\Testbench\TestCase;
use Psr\Log\LoggerInterface;
use Psr\Log\LogLevel;

uses(TestCase::class);

/**
 * In-memory PSR-3 logger. Every `log()` call is captured for
 * assertions on level, message, context. Used as the default
 * channel and (per test) as one or more named channels.
 */
final class LogReporterRecordingLogger implements LoggerInterface
{
    /** @var list<array{level: string, message: string, context: array<string, mixed>}> */
    public array $records = [];

    public function emergency(string|\Stringable $message, array $context = []): void
    {
        $this->log(LogLevel::EMERGENCY, $message, $context);
    }

    public function alert(string|\Stringable $message, array $context = []): void
    {
        $this->log(LogLevel::ALERT, $message, $context);
    }

    public function critical(string|\Stringable $message, array $context = []): void
    {
        $this->log(LogLevel::CRITICAL, $message, $context);
    }

    public function error(string|\Stringable $message, array $context = []): void
    {
        $this->log(LogLevel::ERROR, $message, $context);
    }

    public function warning(string|\Stringable $message, array $context = []): void
    {
        $this->log(LogLevel::WARNING, $message, $context);
    }

    public function notice(string|\Stringable $message, array $context = []): void
    {
        $this->log(LogLevel::NOTICE, $message, $context);
    }

    public function info(string|\Stringable $message, array $context = []): void
    {
        $this->log(LogLevel::INFO, $message, $context);
    }

    public function debug(string|\Stringable $message, array $context = []): void
    {
        $this->log(LogLevel::DEBUG, $message, $context);
    }

    public function log($level, string|\Stringable $message, array $context = []): void
    {
        $this->records[] = [
            'level' => (string) $level,
            'message' => (string) $message,
            'context' => $context,
        ];
    }
}

/**
 * Fake LogManager that hands out our recording logger for both the
 * default channel and any named channel — so tests can inspect
 * channel routing without configuring Monolog handlers.
 */
final class LogReporterRecordingLogManager
{
    /** @var array<string, LogReporterRecordingLogger> */
    public array $byChannel = [];

    public LogReporterRecordingLogger $default;

    /** @var list<string> */
    public array $requestedChannels = [];

    public function __construct()
    {
        $this->default = new LogReporterRecordingLogger;
    }

    public function channel(?string $channel = null): LogReporterRecordingLogger
    {
        $this->requestedChannels[] = (string) $channel;

        return $this->byChannel[$channel] ??= new LogReporterRecordingLogger;
    }

    // The manager IS itself a PSR-3 fallback logger — proxy to the
    // default recorder so `Log::log(...)` writes go there.
    public function log($level, string|\Stringable $message, array $context = []): void
    {
        $this->default->log($level, $message, $context);
    }
}

/**
 * Swap the container's `log` binding for our fake manager.
 */
function bindRecordingLogManager(): LogReporterRecordingLogManager
{
    $manager = new LogReporterRecordingLogManager;
    app()->instance('log', $manager);

    return $manager;
}

function makeLogReporter(): LogReporter
{
    return new LogReporter(
        container: app(),
        mapper: new ExceptionMapper,
        redactor: new Redactor,
        traceCleaner: new TraceCleaner(stripPaths: false),
    );
}

// -----------------------------------------------------------------
// shouldReport
// -----------------------------------------------------------------

it('shouldReport returns true for a bare Exception by default', function (): void {
    // Baseline: an Stackra exception has no `report()` method
    // override, so the reporter fires.
    $reporter = makeLogReporter();

    expect($reporter->shouldReport(ForbiddenException::make()))->toBeTrue();
});

it('shouldReport returns true for a non-Exception throwable', function (): void {
    // Framework `dontReport` handles the coarse skip list —
    // reporter defaults to `true` so wrapped RuntimeExceptions get
    // seen.
    $reporter = makeLogReporter();

    expect($reporter->shouldReport(new RuntimeException('boom')))->toBeTrue();
});

it('shouldReport returns false when the exception subclass report() returns false', function (): void {
    // A subclass can opt out of reporting by declaring
    // `public function report(): bool { return false; }`. The
    // reporter checks for that hook via `method_exists` + call.
    $silent = new class extends Exception
    {
        public const CODE = 'test.silent';

        public function report(): bool
        {
            return false;
        }
    };

    $reporter = makeLogReporter();

    expect($reporter->shouldReport($silent))->toBeFalse();
});

// -----------------------------------------------------------------
// PSR-3 level derivation
// -----------------------------------------------------------------

it('logs a 4xx exception at info level', function (): void {
    // ForbiddenException has `Warning` severity → PSR-3 `warning`.
    // Test a plainer Info exception first.
    $manager = bindRecordingLogManager();

    $reporter = makeLogReporter();

    $exception = new class extends Exception
    {
        public const CODE = 'test.info_case';

        protected ErrorSeverity $severity = ErrorSeverity::Info;

        protected ErrorCategory $category = ErrorCategory::Validation;
    };

    $reporter->report($exception);

    expect($manager->default->records[0]['level'])->toBe(LogLevel::INFO);
});

it('logs a 5xx exception at critical level', function (): void {
    // A 500-class exception with `Critical` severity should emit
    // `critical` — never blanket-`error`.
    $manager = bindRecordingLogManager();

    $reporter = makeLogReporter();

    $exception = new class extends Exception
    {
        public const CODE = 'test.critical_case';

        protected ErrorSeverity $severity = ErrorSeverity::Critical;
    };

    $reporter->report($exception);

    expect($manager->default->records[0]['level'])->toBe(LogLevel::CRITICAL);
});

it('logs at emergency level for an Emergency severity', function (): void {
    // ConfigurationException-style severity — pager fodder.
    $manager = bindRecordingLogManager();

    $reporter = makeLogReporter();

    $exception = new class extends Exception
    {
        public const CODE = 'test.emergency_case';

        protected ErrorSeverity $severity = ErrorSeverity::Emergency;
    };

    $reporter->report($exception);

    expect($manager->default->records[0]['level'])->toBe(LogLevel::EMERGENCY);
});

// -----------------------------------------------------------------
// Channel routing — the DEFAULT_CHANNELS map
// -----------------------------------------------------------------

it('routes security-category events to the security channel', function (): void {
    // Cross-tenant access → category `Security` → channel `security`.
    $manager = bindRecordingLogManager();

    $reporter = makeLogReporter();
    $reporter->report(TenantException::crossTenantAccess(1, 2));

    // The reporter asked the manager for the `security` channel and
    // wrote there — the default channel should NOT have received
    // the record.
    expect($manager->requestedChannels)->toContain('security')
        ->and($manager->byChannel['security']->records)->toHaveCount(1)
        ->and($manager->default->records)->toHaveCount(0);
});

it('routes tenancy-category events to the security channel', function (): void {
    // Tenancy category shares the security channel — dashboards
    // fan out from there.
    $manager = bindRecordingLogManager();

    $reporter = makeLogReporter();
    $reporter->report(TenantException::missingTenant());

    expect($manager->requestedChannels)->toContain('security')
        ->and($manager->byChannel['security']->records)->toHaveCount(1);
});

it('routes integration-category events to the upstream channel', function (): void {
    // Third-party outages land on the upstream channel — SRE
    // filters there.
    $manager = bindRecordingLogManager();

    $reporter = makeLogReporter();
    $reporter->report(IntegrationException::upstream('stripe', 502, []));

    expect($manager->requestedChannels)->toContain('upstream')
        ->and($manager->byChannel['upstream']->records)->toHaveCount(1);
});

it('falls back to the default channel when no category override applies', function (): void {
    // A Validation-category exception isn't in DEFAULT_CHANNELS →
    // the manager writes through its own default channel (no
    // named-channel resolution).
    $manager = bindRecordingLogManager();

    $reporter = makeLogReporter();

    $exception = new class extends Exception
    {
        public const CODE = 'test.default_channel';

        protected ErrorSeverity $severity = ErrorSeverity::Info;

        protected ErrorCategory $category = ErrorCategory::Validation;
    };

    $reporter->report($exception);

    // Default channel received the record; no named channel was
    // requested.
    expect($manager->default->records)->toHaveCount(1)
        ->and($manager->requestedChannels)->toBeEmpty();
});

// -----------------------------------------------------------------
// Structured context payload
// -----------------------------------------------------------------

it('populates the documented context keys on the log record', function (): void {
    $manager = bindRecordingLogManager();

    $reporter = makeLogReporter();
    $reporter->report(
        ForbiddenException::missingPermission('billing.write')
            ->withCorrelationId('req_test'),
    );

    // ForbiddenException routes through Authorization category —
    // no channel override → default.
    $record = $manager->default->records[0];

    expect($record['context'])->toHaveKeys([
        'error_code',
        'error_category',
        'error_severity',
        'http_status',
        'correlation_id',
        'retry_after',
        'origin_class',
        'context',
        'request',
        'trace',
        'previous',
    ])
        ->and($record['context']['error_code'])->toBe('auth.forbidden')
        ->and($record['context']['error_category'])->toBe('authorization')
        ->and($record['context']['error_severity'])->toBe('warning')
        ->and($record['context']['http_status'])->toBe(403)
        ->and($record['context']['correlation_id'])->toBe('req_test');
});

// -----------------------------------------------------------------
// Redaction of the message
// -----------------------------------------------------------------

it('runs the message through the redactor', function (): void {
    // Emergency-severity Bearer-token leak in the message — the
    // reporter must scrub it before writing.
    $manager = bindRecordingLogManager();

    $reporter = makeLogReporter();

    $exception = new class extends Exception
    {
        public const CODE = 'test.leaky';

        protected ErrorSeverity $severity = ErrorSeverity::Error;
    };
    $exception = $exception::make('call failed with Authorization: Bearer abc.def.ghi');

    $reporter->report($exception);

    $record = $manager->default->records[0];

    // Redactor preserves the "Bearer " prefix but replaces the
    // token portion.
    expect($record['message'])->toContain('Bearer [REDACTED]')
        ->and($record['message'])->not->toContain('abc.def.ghi');
});

// -----------------------------------------------------------------
// priority
// -----------------------------------------------------------------

it('priority is 100 so log runs before external reporters', function (): void {
    // Log MUST run first — otherwise a broken external reporter
    // could rob us of the local log line.
    $reporter = makeLogReporter();

    expect($reporter->priority())->toBe(100);
});
