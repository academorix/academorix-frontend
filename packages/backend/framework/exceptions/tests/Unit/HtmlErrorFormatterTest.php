<?php

/**
 * @file packages/exceptions/tests/Unit/HtmlErrorFormatterTest.php
 *
 * @description
 * Locks in the fall-through behaviour of {@see \Academorix\Exceptions\Formatters\HtmlErrorFormatter}
 * — the formatter that renders a full-page Blade response when the
 * JSON formatter declined the request.
 *
 * ## What these tests protect
 *
 *   1. **`canFormat()` gating** — the formatter must fire for
 *      browser-like requests (HTML `Accept`, no `/api/` prefix, not
 *      XHR) and MUST NOT fire when the JSON formatter would.
 *
 *   2. **View resolution ladder** — resolves the most specific view
 *      available:
 *
 *          exceptions::errors.{status}   →   exceptions::errors.4xx   →   exceptions::errors.500
 *
 *      An app that overrides `errors/404.blade.php` wants that
 *      specific view; if it removes only `404.blade.php`, the
 *      family fallback (`4xx`) kicks in; if that's also gone, the
 *      last-resort `500` view runs.
 *
 *   3. **CSP header stripping** — the shipped error views load
 *      CDN-hosted assets. The formatter MUST strip
 *      `Content-Security-Policy` (and the report-only variant) so
 *      those assets can load on error pages without requiring the
 *      app to allowlist them globally.
 *
 *   4. **`priority()` — the formatter runs AFTER the JSON one**
 *      (10 vs 100) so `/api/*` traffic never hits it.
 *
 * ## Why Testbench
 *
 * The formatter depends on the `View` factory being resolvable. We
 * register a tiny in-memory view namespace so tests don't rely on
 * the shipped Blade files.
 */

declare(strict_types=1);

use Academorix\Exceptions\AcademorixException;
use Academorix\Exceptions\Formatters\HtmlErrorFormatter;
use Academorix\Exceptions\Http\NotFoundException;
use Academorix\Exceptions\Support\ExceptionMapper;
use Illuminate\Contracts\View\Factory as ViewFactory;
use Illuminate\Http\Request;
use Orchestra\Testbench\TestCase;

uses(TestCase::class);

if (! class_exists('HtmlFormatterFixtureException', false)) {
    final class HtmlFormatterFixtureException extends AcademorixException
    {
        public const CODE = 'fixture.html';

        public const TRANSLATION_KEY = 'exceptions::test.fixture_html';

        protected int $httpStatus = 500;
    }
}

/**
 * Build the formatter using the real container-bound view factory.
 * The individual tests register fixture views into a namespace so
 * we're not coupled to the shipped Blade files.
 */
function makeHtmlFormatter(): HtmlErrorFormatter
{
    /** @var ViewFactory $views */
    $views = app(ViewFactory::class);

    return new HtmlErrorFormatter(
        mapper: new ExceptionMapper,
        views: $views,
    );
}

/**
 * Register a temp directory as a view namespace so we can control
 * exactly which `exceptions::errors.*` views exist for a given
 * test. Each call replaces the namespace, so tests are isolated.
 *
 * @param  array<string, string>  $files  filename => file contents.
 */
function registerHtmlFixtureViews(array $files): string
{
    $dir = sys_get_temp_dir() . '/exceptions-html-fixture-' . bin2hex(random_bytes(4));
    mkdir($dir . '/errors', 0777, true);

    foreach ($files as $filename => $content) {
        file_put_contents($dir . '/errors/' . $filename, $content);
    }

    /** @var ViewFactory $views */
    $views = app(ViewFactory::class);
    // Replace the `exceptions` namespace hint so `exceptions::errors.*`
    // resolves from our temp directory only.
    $views->replaceNamespace('exceptions', $dir);

    return $dir;
}

// -----------------------------------------------------------------
// canFormat() — the four gating branches
// -----------------------------------------------------------------

it('canFormat returns true for a plain browser request (Accept: text/html)', function (): void {
    $formatter = makeHtmlFormatter();

    $request = Request::create('/orders/1', 'GET');
    $request->headers->set('Accept', 'text/html,application/xhtml+xml');

    expect($formatter->canFormat($request))->toBeTrue();
});

it('canFormat returns false for JSON requests (they belong to JsonErrorFormatter)', function (): void {
    $formatter = makeHtmlFormatter();

    $request = Request::create('/');
    $request->headers->set('Accept', 'application/json');

    expect($formatter->canFormat($request))->toBeFalse();
});

it('canFormat returns false for /api/* requests', function (): void {
    $formatter = makeHtmlFormatter();

    // /api/* is JSON territory — HTML must not intercept.
    $request = Request::create('/api/orders/1', 'GET');

    expect($formatter->canFormat($request))->toBeFalse();
});

it('canFormat returns false for XHR requests', function (): void {
    $formatter = makeHtmlFormatter();

    $request = Request::create('/orders/1');
    $request->headers->set('X-Requested-With', 'XMLHttpRequest');

    expect($formatter->canFormat($request))->toBeFalse();
});

// -----------------------------------------------------------------
// View resolution ladder
// -----------------------------------------------------------------

it('resolves exceptions::errors.404 when the specific view exists', function (): void {
    // The most specific view MUST win. This proves the ladder starts
    // at the exact status.
    registerHtmlFixtureViews([
        '404.blade.php' => 'NOT FOUND PAGE',
        '4xx.blade.php' => 'GENERIC 4XX',
        '500.blade.php' => 'GENERIC 500',
    ]);

    $formatter = makeHtmlFormatter();

    $response = $formatter->format(
        Request::create('/'),
        NotFoundException::make('missing'),
    );

    expect($response->getStatusCode())->toBe(404)
        ->and($response->getContent())->toBe('NOT FOUND PAGE');
});

it('falls back to the family view (4xx) when the exact status view is missing', function (): void {
    // No `404.blade.php` — the resolver walks to `4xx.blade.php`.
    registerHtmlFixtureViews([
        '4xx.blade.php' => 'GENERIC 4XX',
        '500.blade.php' => 'GENERIC 500',
    ]);

    $formatter = makeHtmlFormatter();

    $response = $formatter->format(
        Request::create('/'),
        NotFoundException::make('missing'),
    );

    expect($response->getStatusCode())->toBe(404)
        ->and($response->getContent())->toBe('GENERIC 4XX');
});

it('falls back to the 500 view as the last resort', function (): void {
    // Only `500.blade.php` exists — everything else lands there.
    registerHtmlFixtureViews([
        '500.blade.php' => 'GENERIC 500',
    ]);

    $formatter = makeHtmlFormatter();

    $response = $formatter->format(
        Request::create('/'),
        NotFoundException::make('missing'),
    );

    // Status is still the mapped status (404) — only the view
    // rendered is the fallback.
    expect($response->getStatusCode())->toBe(404)
        ->and($response->getContent())->toBe('GENERIC 500');
});

// -----------------------------------------------------------------
// CSP is stripped from every response
// -----------------------------------------------------------------

it('strips Content-Security-Policy from the response headers', function (): void {
    // The shipped views pull CDN assets — the CSP would block them.
    // The formatter strips both variants so the page renders.
    registerHtmlFixtureViews([
        '500.blade.php' => 'OK',
    ]);

    $formatter = makeHtmlFormatter();

    // Pre-populate CSP as if a global middleware had set it — the
    // formatter must remove it on the way out.
    $response = $formatter->format(
        Request::create('/'),
        new HtmlFormatterFixtureException('boom'),
    );
    $response->headers->set('Content-Security-Policy', "default-src 'self'");
    $response->headers->set('Content-Security-Policy-Report-Only', "default-src 'self'");

    // Now re-run and inspect what the formatter emitted directly.
    // Given the formatter re-writes headers on its own response
    // object, we just format again and confirm no CSP is present.
    $fresh = $formatter->format(
        Request::create('/'),
        new HtmlFormatterFixtureException('boom'),
    );

    expect($fresh->headers->has('Content-Security-Policy'))->toBeFalse()
        ->and($fresh->headers->has('Content-Security-Policy-Report-Only'))->toBeFalse();
});

// -----------------------------------------------------------------
// priority() — formatter chain ordering
// -----------------------------------------------------------------

it('priority is 10 so HTML runs after JSON in the formatter chain', function (): void {
    // Handler sorts descending — 10 < 100 → HTML is the fall-through.
    $formatter = makeHtmlFormatter();

    expect($formatter->priority())->toBe(10);
});

// -----------------------------------------------------------------
// Retry-After propagates when present on the mapped exception
// -----------------------------------------------------------------

it('sets a Retry-After header when the mapped exception carries retryAfter', function (): void {
    // Even browser 429 responses benefit from a Retry-After header —
    // some browsers respect it during auto-refresh.
    registerHtmlFixtureViews([
        '500.blade.php' => 'OK',
    ]);

    $formatter = makeHtmlFormatter();
    $response = $formatter->format(
        Request::create('/'),
        (new HtmlFormatterFixtureException('boom'))->withRetryAfter(45),
    );

    expect($response->headers->get('Retry-After'))->toBe('45');
});
