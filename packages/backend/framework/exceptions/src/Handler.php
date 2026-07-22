<?php

declare(strict_types=1);

namespace Stackra\Exceptions;

use Stackra\Exceptions\Contracts\ErrorFormatterInterface;
use Stackra\Exceptions\Contracts\ExceptionReporterInterface;
use Illuminate\Auth\AuthenticationException as LaravelAuthenticationException;
use Illuminate\Contracts\Container\Container;
use Illuminate\Foundation\Exceptions\Handler as LaravelHandler;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException as LaravelValidationException;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Custom exception handler that replaces Laravel's default. The
 * container is instructed to resolve
 * `Illuminate\Contracts\Debug\ExceptionHandler` to this class via
 * {@see \Stackra\Exceptions\Providers\ExceptionsServiceProvider}.
 *
 * ## Responsibilities
 *
 *   1. **Report** — iterate every registered
 *      {@see ExceptionReporterInterface} with per-reporter error
 *      isolation. Sorted by priority (descending).
 *
 *   2. **Render** — walk registered
 *      {@see ErrorFormatterInterface} implementations and delegate
 *      to the first whose `canFormat(request)` returns true. If
 *      none match, fall through to Laravel's own render pipeline.
 *
 * The Blade-based `renderHttpException()` override was removed on
 * 2026-07-21 (Phase C1) alongside the shipped Blade views. The
 * workspace is headless per ADR-0021 + `.kiro/steering/architecture.md`
 * §Headless only, so every response goes through the JSON
 * formatter path.
 *
 * ## Octane safety
 *
 * No static mutable state; every dependency arrives via constructor.
 * The `iterable` types for formatters + reporters are populated by
 * container tagging so they can be resolved lazily per request when
 * needed.
 *
 * ## Reference architecture note
 *
 * This class is inspired by the shared "Stackra" handler pattern
 * but adapted to `Stackra` conventions:
 *
 *   - Uses container tagging (`stackra.exception.formatters` /
 *     `stackra.exception.reporters`) instead of custom attribute
 *     binding (`#[Bind]` / `#[Singleton]`) — which lives in a
 *     separate container-attributes package we don't yet have.
 *   - Adds the `defaultRender` fall-through so unmatched exceptions
 *     still get Laravel's default handler, keeping the pipeline
 *     graceful during migration.
 */
class Handler extends LaravelHandler
{
    /**
     * A list of exception types that are not reported. Applied on
     * top of the framework's own default `dontReport` list.
     *
     * @var array<int, class-string<Throwable>>
     */
    protected $dontReport = [
        LaravelValidationException::class,
        LaravelAuthenticationException::class,
    ];

    /**
     * A list of the request inputs that are never flashed to the
     * session when an exception is rendered.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
        'new_password',
        'token',
        'access_token',
        'refresh_token',
        'authorization',
        'api_key',
        'secret',
        'client_secret',
        'webhook_secret',
        'ssn',
        'card_number',
        'cvc',
        'cvv',
    ];

    /**
     * @param  Container                                  $container   The application container.
     * @param  iterable<ErrorFormatterInterface>          $formatters  Formatter chain, sorted by priority desc.
     * @param  iterable<ExceptionReporterInterface>       $reporters   Reporter chain, sorted by priority desc.
     */
    public function __construct(
        Container $container,
        protected readonly iterable $formatters = [],
        protected readonly iterable $reporters = [],
    ) {
        parent::__construct($container);
    }

    /**
     * Register the exception handling callbacks for the application.
     *
     * Attaches a single reportable callback that iterates every
     * registered {@see ExceptionReporterInterface} implementation
     * with error isolation. Reporter failures never propagate up to
     * the framework; they're caught + swallowed so a broken external
     * service doesn't crash the response pipeline.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $throwable): void {
            foreach ($this->reporters as $reporter) {
                try {
                    if ($reporter->shouldReport($throwable)) {
                        $reporter->report($throwable);
                    }
                } catch (Throwable) {
                    // Reporter failure must never break the application.
                }
            }
        });
    }

    /**
     * Render an exception into an HTTP response.
     *
     * Iterates formatters in priority order and delegates to the
     * first formatter whose {@see ErrorFormatterInterface::canFormat()}
     * returns `true`. Falls back to Laravel's default rendering when
     * no formatter matches — since Phase C1 (2026-07-21) that
     * fallback no longer routes through a Blade view; the workspace
     * is headless per ADR-0021.
     *
     * @param  Request    $request  The incoming HTTP request.
     * @param  Throwable  $e        The exception to render.
     * @return Response
     */
    public function render($request, Throwable $e): Response
    {
        foreach ($this->formatters as $formatter) {
            if ($formatter->canFormat($request)) {
                return $formatter->format($request, $e);
            }
        }

        return parent::render($request, $e);
    }
}
