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
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
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
 *      none match, fall through to Laravel's own render pipeline —
 *      which in turn calls our overridden {@see renderHttpException()}
 *      for Blade-based error pages.
 *
 *   3. **Render HTTP exceptions via published Blade views** — checks
 *      `view()->exists("exceptions::errors.{$status}")` and renders
 *      the matching Blade template when available. Strips the CSP
 *      header so CDN-hosted assets (Tailwind, fonts) can load on
 *      error pages without a full app-CSP allowlist.
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
     * returns `true`. Falls back to Laravel's default rendering
     * (which routes through {@see renderHttpException()} below for
     * `HttpExceptionInterface` throwables) when no formatter
     * matches.
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

    /**
     * Render an `HttpExceptionInterface` throwable using the
     * package's shipped Blade views when available.
     *
     * Convention: each status code has an optional `exceptions::errors.{status}`
     * view (published in `packages/exceptions/views/errors/*.blade.php`).
     * When present, it wins; otherwise the framework renders its own
     * default page.
     *
     * CSP is stripped on the response because error pages typically
     * pull assets from CDNs (Tailwind CDN, Google Fonts) that the
     * app's default CSP won't allowlist.
     */
    protected function renderHttpException(HttpExceptionInterface $e): Response
    {
        $status = $e->getStatusCode();
        $view = "exceptions::errors.{$status}";

        if (view()->exists($view)) {
            $response = response()->view(
                $view,
                ['exception' => $e],
                $status,
                $e->getHeaders(),
            );

            $response->headers->remove('Content-Security-Policy');
            $response->headers->remove('Content-Security-Policy-Report-Only');

            return $response;
        }

        return parent::renderHttpException($e);
    }
}
