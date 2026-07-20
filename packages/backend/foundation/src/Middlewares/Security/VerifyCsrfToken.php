<?php

declare(strict_types=1);

/**
 * Verify Csrf Token Middleware
 *
 * Security middleware that enforces protective measures on incoming requests.
 * Runs in the HTTP pipeline to guard against common attack vectors.
 *
 * @category Middlewares
 *
 * @since    1.0.0
 */
namespace Academorix\Foundation\Middlewares\Security;

use Closure;
use Exception;

use function hash_equals;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;

use function in_array;
use function is_string;

use Academorix\Foundation\Enums\HttpMethod;
use Academorix\Routing\Attributes\AsMiddleware;
use Academorix\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Verify CSRF Token Middleware.
 *
 * Protects against Cross-Site Request Forgery (CSRF) attacks by verifying tokens
 * for state-changing requests. CSRF attacks trick authenticated users into executing
 * unwanted actions on a web application.
 *
 * ## When CSRF Protection is Needed:
 *
 * - **Cookie-based authentication** (Laravel Sanctum stateful, session auth)
 * - **Web applications** with forms and AJAX requests
 * - **State-changing operations** (POST, PUT, PATCH, DELETE)
 *
 * ## When CSRF Protection is NOT Needed:
 *
 * - **Stateless token-based APIs** (Bearer tokens, API keys)
 * - **Read-only operations** (GET, HEAD, OPTIONS)
 * - **Webhooks and external integrations** (no session/cookies)
 *
 * ## How It Works:
 *
 * 1. Laravel generates a unique CSRF token per session
 * 2. Token is embedded in forms or available via meta tag
 * 3. Client includes token in requests (header or form field)
 * 4. Middleware verifies token matches session token
 * 5. Request proceeds if valid, returns 419 if invalid
 *
 * ## Token Sources (Priority Order):
 *
 * 1. `_token` form field
 * 2. `X-CSRF-TOKEN` header (for AJAX)
 * 3. `X-XSRF-TOKEN` header (encrypted cookie, for frameworks like Angular)
 *
 * ## Configuration:
 *
 * Add URIs to `$except` array to bypass CSRF verification:
 *
 * ```php
 * protected array $except = [
 *     'api/webhooks/*',      // External webhooks
 *     'api/external/*',      // Third-party integrations
 *     'stripe/webhook',      // Payment provider callbacks
 * ];
 * ```
 *
 * ## Security Notes:
 *
 * - Uses timing-safe comparison (`hash_equals`) to prevent timing attacks
 * - Automatically skips verification for Bearer token requests
 * - Returns 419 (Page Expired) for invalid tokens
 * - Safe methods (GET, HEAD, OPTIONS) are always allowed
 *
 * @since 1.0.0
 */
#[AsMiddleware(
    alias: 'csrf',
    groups: ['web'],
    priority: 25
)]
class VerifyCsrfToken
{
    /**
     * URIs that should be excluded from CSRF verification.
     *
     * Add patterns for webhooks, external integrations, or any endpoints
     * that receive requests from external systems without session cookies.
     *
     * Supports wildcards: 'api/webhooks/*' matches all webhook routes.
     *
     * @var array<string>
     */
    protected array $except = [
        'api/webhooks/*',
        'api/external/*',
        '_boost*',  // Boost browser logging
    ];

    /**
     * Handle an incoming request.
     *
     * Verifies CSRF token for state-changing requests using cookie-based authentication.
     *
     * ## Verification Flow:
     *
     * 1. Check if URI is in exception list → Allow
     * 2. Check if safe HTTP method (GET, HEAD, OPTIONS) → Allow
     * 3. Check if Bearer token present (stateless API) → Allow
     * 4. Verify CSRF token matches session token → Allow or Reject
     *
     * @param  Request                      $request The incoming HTTP request
     * @param  Closure(Request): (Response) $next    The next middleware in the pipeline
     * @return Response                     The HTTP response (419 if token mismatch)
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip CSRF verification for excluded URIs (webhooks, external APIs)
        if ($this->inExceptArray($request)) {
            return $next($request);
        }

        // Skip CSRF verification for safe HTTP methods
        // GET, HEAD, OPTIONS don't modify state, so CSRF isn't a concern
        if ($this->isReading($request)) {
            return $next($request);
        }

        // Skip CSRF verification for stateless API requests
        // Bearer tokens are not vulnerable to CSRF attacks
        if ($request->bearerToken()) {
            return $next($request);
        }

        // Verify CSRF token for stateful requests (cookie-based auth)
        // This is the core CSRF protection for session-based authentication
        if (! $this->tokensMatch($request)) {
            return response()->json([
                'success' => false,
                'message' => 'CSRF token mismatch',
            ], 419);  // 419 Page Expired (standard Laravel CSRF error code)
        }

        return $next($request);
    }

    /**
     * Determine if the request URI should bypass CSRF verification.
     *
     * Checks if the request URI matches any pattern in the `$except` array.
     * Supports wildcard patterns using Laravel's `is()` method.
     *
     * @param  Request $request The incoming HTTP request
     * @return bool    True if URI should bypass CSRF, false otherwise
     */
    protected function inExceptArray(Request $request): bool
    {
        foreach ($this->except as $except) {
            // Normalize the pattern (remove leading/trailing slashes)
            if ($except !== '/') {
                $except = Str::trim($except, '/');
            }

            // Check if request URI matches the pattern
            // Supports wildcards: 'api/webhooks/*' matches 'api/webhooks/stripe'
            if ($request->is($except)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Determine if the HTTP request uses a safe (read-only) method.
     *
     * Safe methods don't modify server state, so they're not vulnerable to CSRF.
     * These methods are idempotent and should not have side effects.
     *
     * @param  Request $request The incoming HTTP request
     * @return bool    True if method is safe (HEAD, GET, OPTIONS), false otherwise
     */
    protected function isReading(Request $request): bool
    {
        return in_array($request->method(), [HttpMethod::GET(), HttpMethod::HEAD(), HttpMethod::OPTIONS()], true);
    }

    /**
     * Determine if the session and request CSRF tokens match.
     *
     * Uses timing-safe comparison to prevent timing attacks that could
     * leak information about the token through response time analysis.
     *
     * @param  Request $request The incoming HTTP request
     * @return bool    True if tokens match, false otherwise
     */
    protected function tokensMatch(Request $request): bool
    {
        // Get token from request (form field or header)
        $requestToken = $this->getTokenFromRequest($request);

        // Get token from session (server-side)
        $sessionToken = Session::token();

        // Verify both tokens exist and match using timing-safe comparison
        // hash_equals prevents timing attacks by comparing in constant time
        if (! is_string($sessionToken) || $requestToken === null) {
            return false;
        }

        return hash_equals($sessionToken, $requestToken);
    }

    /**
     * Get the CSRF token from the request.
     *
     * Checks multiple sources in priority order:
     * 1. `_token` form field (standard Laravel forms)
     * 2. `X-CSRF-TOKEN` header (AJAX requests, meta tag)
     * 3. `X-XSRF-TOKEN` header (encrypted cookie, Angular/Vue)
     *
     * @param  Request     $request The incoming HTTP request
     * @return string|null The CSRF token, or null if not found
     */
    protected function getTokenFromRequest(Request $request): ?string
    {
        // Check form field first, then X-CSRF-TOKEN header
        $token = $request->input('_token') ?: $request->header('X-CSRF-TOKEN');

        // Check X-XSRF-TOKEN header (encrypted cookie)
        // Some JavaScript frameworks (Angular, Vue) use this approach
        if (! $token && $header = $request->header('X-XSRF-TOKEN')) {
            $headerValue = is_array($header) ? ($header[0] ?? null) : $header;
            if ($headerValue !== null) {
                $token = $this->decryptCookie($headerValue);
            }
        }

        return $token !== null && is_string($token) ? $token : null;
    }

    /**
     * Decrypt the CSRF token from an encrypted cookie.
     *
     * Some frameworks store the CSRF token in an encrypted cookie
     * and send it back in the X-XSRF-TOKEN header.
     *
     * @param  string      $cookie The encrypted cookie value
     * @return string|null The decrypted token, or null if decryption fails
     */
    protected function decryptCookie(string $cookie): ?string
    {
        try {
            // Decrypt the cookie value
            // Second parameter (false) means don't unserialize
            $decrypted = decrypt($cookie, false);

            return is_string($decrypted) ? $decrypted : null;
        } catch (Exception) {
            // Decryption failed (invalid cookie, tampered data, etc.)
            return null;
        }
    }
}
