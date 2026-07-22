<?php

declare(strict_types=1);

namespace Stackra\Exceptions\Formatters;

use Stackra\Exceptions\Contracts\ErrorFormatterInterface;
use Stackra\Exceptions\Support\ExceptionMapper;
use Illuminate\Contracts\View\Factory as ViewFactory;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\Response as HttpFoundationResponse;
use Throwable;

/**
 * Formatter that renders Blade error pages for browser-navigation
 * requests (non-API, non-XHR, `Accept: text/html`).
 *
 * ## When it fires
 *
 * {@see canFormat()} returns `true` only when JSON's contract
 * ({@see JsonErrorFormatter::canFormat()}) does NOT — i.e. the
 * request is a browser navigation to a non-`/api/*` path with
 * `Accept: text/html`. Priority is `10` so JSON's `100` beats it
 * for every API call.
 *
 * ## What it renders
 *
 * Views under `resources/views/errors/{status}.blade.php` (published
 * from `packages/backend/framework/exceptions/src/views/errors/`
 * via the `exceptions::` view namespace). Each page extends
 * `foundation::layouts.app`. When the exact status has no dedicated
 * template we fall through to Laravel's default renderer — which
 * itself renders the framework's minimal fallback page.
 *
 * ## Octane safety
 *
 * No mutable state. Every call reads the injected view factory +
 * mapper freshly.
 *
 * @category Formatters
 *
 * @since    0.1.0
 */
final class HtmlErrorFormatter implements ErrorFormatterInterface
{
    /**
     * @param  ExceptionMapper  $mapper  Maps arbitrary throwables to Stackra exceptions with an HTTP status.
     * @param  ViewFactory      $views   The Blade factory (used to check `exists()` before render).
     */
    public function __construct(
        private readonly ExceptionMapper $mapper,
        private readonly ViewFactory $views,
    ) {}

    /**
     * Fire only for HTML browser navigation to non-API paths.
     *
     * Returning `false` lets the formatter chain fall through to
     * {@see JsonErrorFormatter} for API traffic + to Laravel's
     * default renderer for exotic content types.
     */
    public function canFormat(Request $request): bool
    {
        // JSON path always wins first — matches the API prefix + Accept.
        if ($request->expectsJson()) {
            return false;
        }

        if ($request->is('api/*')) {
            return false;
        }

        if ($request->ajax()) {
            return false;
        }

        return \str_contains((string) $request->header('Accept', ''), 'text/html')
            || $request->header('Accept') === null
            || $request->header('Accept') === '*/*';
    }

    /**
     * Render the throwable as a Blade error page.
     *
     * When the exact status has no `errors/{status}.blade.php`
     * template we return Laravel's default fallback (which renders
     * a minimal HTML response) rather than crashing on a missing
     * view.
     */
    public function format(Request $request, Throwable $e): HttpFoundationResponse
    {
        $mapped = $this->mapper->map($e);
        $status = $mapped->httpStatus();
        $viewName = "exceptions::errors.{$status}";

        if (! $this->views->exists($viewName)) {
            // No dedicated template — throw back to Laravel's default
            // render pipeline, which owns the ultimate HTML fallback.
            throw $e;
        }

        $view = $this->views->make($viewName, [
            'exception' => $e,
            'mapped' => $mapped,
            'status' => $status,
        ]);

        return new Response($view->render(), $status);
    }

    /**
     * Priority `10` — below JSON's `100` so API traffic never
     * lands here.
     */
    public function priority(): int
    {
        return 10;
    }
}
