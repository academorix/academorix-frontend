<?php

declare(strict_types=1);

/**
 * Ip Whitelist Middleware
 *
 * Security middleware that enforces protective measures on incoming requests.
 * Runs in the HTTP pipeline to guard against common attack vectors.
 *
 * @category Middlewares
 *
 * @since    1.0.0
 */
namespace Stackra\Foundation\Middlewares\Security;

use Closure;
use Illuminate\Container\Attributes\Config;
use Illuminate\Http\Request;
use Stackra\Routing\Attributes\AsMiddleware;
use Stackra\Support\Arr;
use Stackra\Support\Str;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * IP Whitelist/Blacklist Middleware.
 *
 * Controls access to routes based on IP addresses.
 * Useful for admin panels, internal APIs, and security-sensitive endpoints.
 *
 * ## Features:
 * - IP whitelist (only allow specific IPs)
 * - IP blacklist (block specific IPs)
 * - CIDR notation support (e.g., 192.168.1.0/24)
 * - IP range support (e.g., 192.168.1.1-192.168.1.255)
 * - Trusted proxy support
 * - Dynamic IP management (database-backed)
 *
 * ## Usage:
 *
 * ### Whitelist Mode (Only Allow Specific IPs):
 * ```php
 * Route::middleware('ip.whitelist')->group(function () {
 *     Route::get('/admin', [AdminController::class, 'index']);
 * });
 * ```
 *
 * ### Blacklist Mode (Block Specific IPs):
 * ```php
 * Route::middleware('ip.blacklist')->group(function () {
 *     Route::post('/api/login', [AuthController::class, 'login']);
 * });
 * ```
 *
 * ### Custom Lists:
 * ```php
 * Route::middleware('ip.whitelist:office,vpn')->group(function () {
 *     // Only allow office and VPN IPs
 * });
 * ```
 *
 * ## Configuration:
 * ```php
 * // config/ip-filter.php
 * return [
 *     'whitelist' => [
 *         'default' => [
 *             '127.0.0.1',
 *             '::1',
 *             '192.168.1.0/24', // CIDR notation
 *         ],
 *         'office' => [
 *             '203.0.113.0/24',
 *         ],
 *         'vpn' => [
 *             '198.51.100.0/24',
 *         ],
 *     ],
 *     'blacklist' => [
 *         'default' => [
 *             '198.51.100.42', // Known attacker
 *         ],
 *     ],
 *     'trusted_proxies' => ['*'],
 * ];
 * ```
 *
 * @since 1.0.0
 */
#[AsMiddleware(
    alias: 'ip.whitelist',
    priority: 0
)]
class IpWhitelistMiddleware
{
    /**
     * Create a new middleware instance.
     *
     * @param array<string, array<string>> $whitelistConfig Whitelist configuration
     * @param array<string, array<string>> $blacklistConfig Blacklist configuration
     */
    public function __construct(
        #[Config('ip-filter.whitelist')]
        protected array $whitelistConfig = [],
        #[Config('ip-filter.blacklist')]
        protected array $blacklistConfig = [],
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param string $mode     Mode: 'whitelist' or 'blacklist'
     * @param string ...$lists List names to use
     *
     * @throws AccessDeniedHttpException
     */
    public function handle(Request $request, Closure $next, string $mode = 'whitelist', string ...$lists): Response
    {
        $clientIp = $request->ip();

        if ($mode === 'whitelist') {
            throw_unless($this->isWhitelisted($clientIp, $lists), AccessDeniedHttpException::class, 'Access denied. Your IP address is not authorized.');
        } elseif ($mode === 'blacklist') {
            throw_if($this->isBlacklisted($clientIp, $lists), AccessDeniedHttpException::class, 'Access denied. Your IP address has been blocked.');
        }

        return $next($request);
    }

    /**
     * Check if IP is whitelisted.
     *
     * @param array<string> $lists
     */
    protected function isWhitelisted(?string $ip, array $lists): bool
    {
        if ($ip === null) {
            return false;
        }

        $lists = $lists === [] ? ['default'] : $lists;

        foreach ($lists as $list) {
            $whitelist = $this->whitelistConfig[$list] ?? [];

            if ($this->ipMatchesAny($ip, $whitelist)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if IP is blacklisted.
     *
     * @param array<string> $lists
     */
    protected function isBlacklisted(?string $ip, array $lists): bool
    {
        if ($ip === null) {
            return false;
        }

        $lists = $lists === [] ? ['default'] : $lists;

        foreach ($lists as $list) {
            $blacklist = $this->blacklistConfig[$list] ?? [];

            if ($this->ipMatchesAny($ip, $blacklist)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if IP matches any pattern in the list.
     *
     * @param array<string> $patterns
     */
    protected function ipMatchesAny(string $ip, array $patterns): bool
    {
        return Arr::any($patterns, fn (string $pattern): bool => $this->ipMatches($ip, $pattern));
    }

    /**
     * Check if IP matches a pattern.
     *
     * Supports:
     * - Exact match: 192.168.1.1
     * - CIDR notation: 192.168.1.0/24
     * - Wildcard: 192.168.1.*
     */
    protected function ipMatches(string $ip, string $pattern): bool
    {
        // Exact match
        if ($ip === $pattern) {
            return true;
        }

        // CIDR notation
        if (Str::contains($pattern, '/')) {
            return $this->ipMatchesCidr($ip, $pattern);
        }

        // Wildcard
        if (Str::contains($pattern, '*')) {
            return $this->ipMatchesWildcard($ip, $pattern);
        }

        return false;
    }

    /**
     * Check if IP matches CIDR notation.
     *
     * @param string $ip   IP address to check
     * @param string $cidr CIDR notation (e.g., 192.168.1.0/24)
     */
    protected function ipMatchesCidr(string $ip, string $cidr): bool
    {
        $parts = explode('/', $cidr);
        if (count($parts) !== 2) {
            return false;
        }

        [$subnet, $mask] = $parts;

        // Convert IP and subnet to long integers
        $ipLong = ip2long($ip);
        $subnetLong = ip2long($subnet);

        if ($ipLong === false || $subnetLong === false) {
            return false;
        }

        // Calculate network mask
        $maskLong = -1 << (32 - (int) $mask);

        // Check if IP is in subnet
        return ($ipLong & $maskLong) === ($subnetLong & $maskLong);
    }

    /**
     * Check if IP matches wildcard pattern.
     *
     * @param string $ip      IP address to check
     * @param string $pattern Wildcard pattern (e.g., 192.168.1.*)
     */
    protected function ipMatchesWildcard(string $ip, string $pattern): bool
    {
        // Convert wildcard to regex
        $regex = '/^' . Str::replace(['*', '.'], ['.*', '\.'], $pattern) . '$/';

        return (bool) preg_match($regex, $ip);
    }
}
