<?php


/**
 * Security Headers Middleware
 *
 * Security middleware that enforces protective measures on incoming requests.
 * Runs in the HTTP pipeline to guard against common attack vectors.
 *
 * @category Middleware
 *
 * @since    1.0.0
 */

declare(strict_types=1);

namespace Stackra\Foundation\Middleware;

use Closure;
use Illuminate\Container\Attributes\Config;
use Illuminate\Http\Request;
use Stackra\Routing\Attributes\AsMiddleware;
use Symfony\Component\HttpFoundation\Response;

/**
 * Security Headers Middleware.
 *
 * Adds security-related HTTP headers to all responses to protect against
 * common web vulnerabilities and attacks. These headers instruct browsers
 * on how to handle the application's content securely.
 *
 * ## Security Headers Added:
 *
 * ### X-Content-Type-Options: nosniff
 * - Prevents MIME type sniffing
 * - Stops browsers from interpreting files as different MIME types
 * - Protects against MIME confusion attacks
 *
 * ### X-Frame-Options: DENY
 * - Prevents clickjacking attacks
 * - Stops the site from being embedded in iframes
 * - Use SAMEORIGIN if you need to embed your own pages
 *
 * ### X-XSS-Protection: 1; mode=block
 * - Enables browser's XSS filter
 * - Blocks page if XSS attack detected
 * - Legacy header but still useful for older browsers
 *
 * ### Referrer-Policy: strict-origin-when-cross-origin
 * - Controls referrer information sent with requests
 * - Sends full URL for same-origin, only origin for cross-origin
 * - Protects user privacy
 *
 * ### Content-Security-Policy (CSP)
 * - Prevents XSS and data injection attacks
 * - Defines trusted content sources
 * - Configurable via config/api.php
 *
 * ### Strict-Transport-Security (HSTS)
 * - Forces HTTPS connections
 * - Only added in production with HTTPS
 * - Prevents protocol downgrade attacks
 *
 * ## Configuration:
 *
 * ```php
 * // config/api.php
 * 'security' => [
 *     'csp_enabled' => true,
 *     'csp_policy' => "default-src 'self'; script-src 'self' 'unsafe-inline'",
 * ]
 * ```
 *
 * ## Security Benefits:
 * - **XSS Protection**: Multiple layers of XSS prevention
 * - **Clickjacking Protection**: Prevents UI redressing attacks
 * - **HTTPS Enforcement**: Forces secure connections in production
 * - **Privacy**: Controls information leakage via referrer
 * - **Content Control**: Restricts resource loading sources
 *
 * ## Browser Support:
 * - Modern browsers: Full support
 * - Legacy browsers: Partial support (graceful degradation)
 * - Mobile browsers: Good support
 *
 * @since 1.0.0
 * @see https://owasp.org/www-project-secure-headers/
 */
#[AsMiddleware(
    alias: 'security.headers',
    groups: ['api', 'web'],
    priority: 60
)]
class SecurityHeaders
{
    /**
     * Create a new middleware instance.
     *
     * @param bool   $cspEnabled Whether CSP is enabled
     * @param string $cspPolicy  CSP policy string
     */
    public function __construct(
        #[Config('api.security.csp_enabled')]
        protected bool $cspEnabled = true,
        #[Config('api.security.csp_policy')]
        protected string $cspPolicy = "default-src 'self'",
    ) {}

    /**
     * Handle an incoming request.
     *
     * Adds security headers to the response after processing the request.
     * Headers are added to the response, not the request, so they're sent
     * to the client's browser.
     *
     * @param  Request                      $request The incoming HTTP request
     * @param  Closure(Request): (Response) $next    The next middleware in the pipeline
     * @return Response                     The HTTP response with security headers added
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Process the request first
        $response = $next($request);

        // Prevent MIME type sniffing
        // Stops browsers from trying to guess content types
        // Prevents attacks where malicious content is disguised as safe content
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Prevent clickjacking attacks
        // DENY: Never allow this site to be embedded in iframes
        // Alternative: SAMEORIGIN (allow same-origin iframes)
        $response->headers->set('X-Frame-Options', 'DENY');

        // Enable XSS protection in browsers
        // 1: Enable XSS filter
        // mode=block: Block the page instead of sanitizing
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // Control referrer information
        // strict-origin-when-cross-origin: Send full URL for same-origin,
        // only origin for cross-origin requests
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Content Security Policy (CSP)
        // Defines which resources can be loaded and executed
        // Only add if enabled in configuration
        if ($this->cspEnabled) {
            $response->headers->set('Content-Security-Policy', $this->cspPolicy);
        }

        // HTTP Strict Transport Security (HSTS)
        // Forces HTTPS connections for the specified duration
        // Only add in production with HTTPS to avoid locking out users
        if (app()->environment('production') && $request->secure()) {
            // max-age=31536000: Enforce HTTPS for 1 year
            // includeSubDomains: Apply to all subdomains
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains'
            );
        }

        return $response;
    }
}
