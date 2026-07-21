<?php

declare(strict_types=1);

namespace Stackra\Exceptions\Formatters;

use Stackra\Exceptions\StackraException;
use Stackra\Exceptions\Contracts\ErrorFormatterInterface;
use Stackra\Exceptions\Support\ExceptionMapper;
use Illuminate\Contracts\View\Factory as ViewFactory;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Formatter that renders a full-page HTML response for browser
 * requests using the Blade error views shipped in
 * `packages/exceptions/views/errors/*.blade.php`.
 *
 * ## When it fires
 *
 * {@see canFormat()} returns `true` when the request is NOT a JSON
 * / API / XHR request — i.e. the fall-through for browser navigation.
 * Because JsonErrorFormatter has higher priority (100 vs. 10), it
 * runs first for API traffic; this formatter only handles the
 * long-tail "user opened a broken URL in their browser" case.
 *
 * ## View resolution
 *
 * Looks for `exceptions::errors.{status}` in the following order:
 *
 *   1. `exceptions::errors.{exact-status}` — e.g. `403`, `404`
 *   2. `exceptions::errors.{family}xx`     — e.g. `4xx`, `5xx`
 *   3. `exceptions::errors.500`            — the ultimate fallback
 *
 * All three levels are provided out of the box; downstream apps
 * override individual pages by publishing:
 *
 *     php artisan vendor:publish --tag=exceptions-views
 *
 * ## CSP handling
 *
 * The shipped views use CDN-hosted assets (Tailwind, Google Fonts).
 * The `Content-Security-Policy` header is stripped from every
 * response this formatter emits so those assets can load without
 * requiring the app to allowlist them globally.
 */
final class HtmlErrorFormatter implements ErrorFormatterInterface
{
    public function __construct(
        private readonly ExceptionMapper $mapper,
        private readonly ViewFactory $views,
    ) {
    }

    public function canFormat(Request $request): bool
    {
        // JSON / API paths are handled by the higher-priority JSON
        // formatter; anything else falls through to HTML.
        return ! $request->expectsJson()
            && ! $request->is('api/*')
            && ! $request->ajax();
    }

    public function format(Request $request, Throwable $e): Response
    {
        $mapped = $this->mapper->map($e);
        $status = $mapped->httpStatus();
        $view = $this->resolveView($status);

        $response = response()->view($view, [
            'exception' => $mapped,
            'status' => $status,
            'title' => $mapped->userMessage() ?? $mapped->getMessage(),
        ], $status);

        // CSP would block the CDN Tailwind / Google Fonts assets our
        // shipped views load. Strip it — the whole point of an
        // error page is to render, not to be secure against
        // asset-loading vectors.
        $response->headers->remove('Content-Security-Policy');
        $response->headers->remove('Content-Security-Policy-Report-Only');

        if ($mapped->retryAfter() !== null) {
            $response->headers->set('Retry-After', (string) $mapped->retryAfter());
        }

        return $response;
    }

    public function priority(): int
    {
        return 10;
    }

    // ---------------------------------------------------------------
    // View resolution
    // ---------------------------------------------------------------

    /**
     * Find the most specific error view available for the given
     * status. Walks status → family → 500.
     */
    private function resolveView(int $status): string
    {
        $candidates = [
            "exceptions::errors.{$status}",
            'exceptions::errors.' . intdiv($status, 100) . 'xx',
            'exceptions::errors.500',
        ];

        foreach ($candidates as $name) {
            if ($this->views->exists($name)) {
                return $name;
            }
        }

        // Should never happen — we ship `errors/500.blade.php` — but
        // if the views were somehow removed, fall back to a raw
        // string via the plain response above the caller uses.
        return $candidates[array_key_last($candidates)];
    }
}
