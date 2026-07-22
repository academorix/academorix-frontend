<?php

/**
 * @file packages/exceptions/tests/Unit/HandlerTest.php
 *
 * @description
 * Unit coverage for {@see \Stackra\Exceptions\Handler}, the custom
 * exception handler that replaces Laravel's default via the
 * `Illuminate\Contracts\Debug\ExceptionHandler` container binding.
 *
 * ## What these tests protect
 *
 *   1. **Formatter chain resolution** — `render()` walks registered
 *      formatters in priority order and returns the first response
 *      from a formatter whose `canFormat()` said yes.
 *
 *   2. **Fall-through to Laravel** — when no formatter matches (rare,
 *      but happens for non-HTTP throwables during boot), `render()`
 *      falls back to `parent::render(...)`.
 *
 *   3. **Reporter error isolation** — a throwing reporter must NOT
 *      stop later reporters from running. Handler wraps each
 *      reporter call in try / catch and swallows failures.
 *
 * The former Blade-based `renderHttpException()` coverage was removed
 * on 2026-07-21 (Phase C1) alongside the method itself — the workspace
 * is headless per ADR-0021 so every response goes through the JSON
 * formatter path.
 *
 * ## Why Testbench
 *
 * The Handler extends Laravel's own {@see \Illuminate\Foundation\Exceptions\Handler}
 * which needs the container to build. Testbench boots the minimal
 * app so the parent works.
 */

declare(strict_types=1);

use Stackra\Exceptions\Contracts\ErrorFormatterInterface;
use Stackra\Exceptions\Contracts\ExceptionReporterInterface;
use Stackra\Exceptions\Handler;
use Illuminate\Http\Request;
use Orchestra\Testbench\TestCase;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

uses(TestCase::class);

/**
 * Stub formatter that answers `canFormat` based on a boolean flag
 * and returns a pre-configured response body. Lets tests assert
 * on which formatter fired without booting the real chain.
 */
final class HandlerTestStubFormatter implements ErrorFormatterInterface
{
    public bool $wasCalled = false;

    public function __construct(
        private readonly bool $accepts,
        private readonly string $body,
        private readonly int $priority = 100,
    ) {
    }

    public function canFormat(Request $request): bool
    {
        return $this->accepts;
    }

    public function format(Request $request, Throwable $e): Response
    {
        $this->wasCalled = true;

        return new Response($this->body, 200);
    }

    public function priority(): int
    {
        return $this->priority;
    }
}

/**
 * Stub reporter that records whether it was called; optionally
 * throws on `report()` so we can prove error isolation works.
 */
final class HandlerTestStubReporter implements ExceptionReporterInterface
{
    public int $reportedCount = 0;

    public function __construct(
        private readonly bool $shouldReport = true,
        private readonly bool $throwsOnReport = false,
    ) {
    }

    public function shouldReport(Throwable $throwable): bool
    {
        return $this->shouldReport;
    }

    public function report(Throwable $throwable): void
    {
        $this->reportedCount++;

        if ($this->throwsOnReport) {
            throw new RuntimeException('reporter kaboom');
        }
    }

    public function priority(): int
    {
        return 100;
    }
}

// -----------------------------------------------------------------
// Constructor wiring
// -----------------------------------------------------------------

it('constructor accepts formatter + reporter iterables and stores them', function (): void {
    // We can't inspect the iterables directly (they're protected)
    // — but we can prove they were stored by watching for their
    // side effects in `render()` / `register()` below. This test
    // just verifies construction doesn't blow up with empty
    // iterables (a common defensive shape).
    $handler = new Handler($this->app, [], []);

    expect($handler)->toBeInstanceOf(Handler::class);
});

// -----------------------------------------------------------------
// render() — first-matching-formatter wins
// -----------------------------------------------------------------

it('render walks formatters and picks the first whose canFormat returns true', function (): void {
    $accepting = new HandlerTestStubFormatter(accepts: true, body: 'MATCHED');
    $rejecting = new HandlerTestStubFormatter(accepts: false, body: 'SHOULD NOT SEE');

    // Note the order: accepting formatter first — Handler iterates
    // in the order the iterable yields them (the container sorts
    // by priority before handing them over).
    $handler = new Handler($this->app, [$accepting, $rejecting], []);

    $response = $handler->render(Request::create('/'), new RuntimeException('boom'));

    expect($response->getContent())->toBe('MATCHED')
        ->and($accepting->wasCalled)->toBeTrue()
        ->and($rejecting->wasCalled)->toBeFalse();
});

it('render skips rejecting formatters and lands on the next accepting one', function (): void {
    $rejecting = new HandlerTestStubFormatter(accepts: false, body: 'REJECTED');
    $accepting = new HandlerTestStubFormatter(accepts: true, body: 'PICKED');

    $handler = new Handler($this->app, [$rejecting, $accepting], []);

    $response = $handler->render(Request::create('/'), new RuntimeException('boom'));

    expect($response->getContent())->toBe('PICKED')
        ->and($rejecting->wasCalled)->toBeFalse()
        ->and($accepting->wasCalled)->toBeTrue();
});

it('render falls through to the parent handler when no formatter matches', function (): void {
    // No matching formatter → the parent's render pipeline handles
    // it. For an `HttpExceptionInterface` throwable that produces a
    // response with the mapped status.
    $noOne = new HandlerTestStubFormatter(accepts: false, body: 'nope');

    $handler = new Handler($this->app, [$noOne], []);

    $response = $handler->render(Request::create('/'), new NotFoundHttpException('missing'));

    // Parent renderer honours the status even if the body is HTML/
    // JSON depending on the config — we assert on status only.
    expect($response->getStatusCode())->toBe(404);
});

// -----------------------------------------------------------------
// register() — reporter iteration with error isolation
// -----------------------------------------------------------------

it('register attaches a reportable callback that iterates every reporter', function (): void {
    $r1 = new HandlerTestStubReporter;
    $r2 = new HandlerTestStubReporter;

    $handler = new Handler($this->app, [], [$r1, $r2]);
    // Wire the reportable callback onto the handler.
    $handler->register();

    // Report a throwable via the Handler's `report()` pipeline —
    // this fires every callable registered by `register()`.
    $handler->report(new RuntimeException('boom'));

    expect($r1->reportedCount)->toBe(1)
        ->and($r2->reportedCount)->toBe(1);
});

it('a throwing reporter does not stop later reporters (error isolation)', function (): void {
    // The load-bearing invariant of the reporter chain: one broken
    // reporter must never rob us of the others.
    $throws = new HandlerTestStubReporter(throwsOnReport: true);
    $survives = new HandlerTestStubReporter;

    $handler = new Handler($this->app, [], [$throws, $survives]);
    $handler->register();

    $handler->report(new RuntimeException('boom'));

    // First reporter threw and was counted; second reporter still
    // ran and was counted.
    expect($throws->reportedCount)->toBe(1)
        ->and($survives->reportedCount)->toBe(1);
});

it('a reporter whose shouldReport returns false is not invoked', function (): void {
    // Reporters own their own skip logic — Handler respects it.
    $skipped = new HandlerTestStubReporter(shouldReport: false);
    $called = new HandlerTestStubReporter;

    $handler = new Handler($this->app, [], [$skipped, $called]);
    $handler->register();

    $handler->report(new RuntimeException('boom'));

    expect($skipped->reportedCount)->toBe(0)
        ->and($called->reportedCount)->toBe(1);
});

// -----------------------------------------------------------------
// renderHttpException() — coverage removed 2026-07-21 (Phase C1).
//
// The Blade-view rendering override was deleted with the shipped
// Blade error pages under the headless mandate (ADR-0021).
// HTTP exceptions now flow through the parent's default render
// pipeline; the JSON formatter has priority 100 so browser + API
// traffic land on it before falling through.
// -----------------------------------------------------------------
