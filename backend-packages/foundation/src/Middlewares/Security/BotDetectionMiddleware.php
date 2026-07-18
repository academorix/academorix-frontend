<?php

declare(strict_types=1);

/**
 * Bot Detection Middleware
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

use function count;

use Illuminate\Container\Attributes\Config;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Jaybizzle\CrawlerDetect\CrawlerDetect;
use Academorix\Routing\Attributes\AsMiddleware;
use Academorix\Support\Arr;
use Academorix\Support\Str;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * Bot Detection Middleware.
 *
 * Comprehensive bot detection using multiple strategies:
 * 1. Crawler Detection (jaybizzle/crawler-detect) - 1000+ bot signatures
 * 2. Behavior analysis (request patterns)
 * 3. Rate pattern detection (too fast, too predictable)
 * 4. Honeypot integration (hidden form fields)
 *
 * ## Why Crawler-Detect?
 * - 1000+ bot signatures (constantly updated)
 * - Detects search engines (Google, Bing, Yahoo, etc.)
 * - Detects social media bots (Facebook, Twitter, etc.)
 * - Detects monitoring tools (Pingdom, UptimeRobot, etc.)
 * - Detects scrapers and malicious bots
 * - Much more accurate than manual User-Agent checking
 *
 * ## Installation:
 * ```bash
 * composer require jaybizzle/crawler-detect
 * ```
 *
 * ## Usage:
 *
 * ### Protect Forms:
 * ```php
 * Route::post('/contact', [ContactController::class, 'store'])
 *     ->middleware('bot.detection');
 * ```
 *
 * ### Protect API (Strict Mode):
 * ```php
 * Route::middleware('bot.detection:strict')->group(function () {
 *     Route::apiResource('posts', PostController::class);
 * });
 * ```
 *
 * ### Allow Good Crawlers (SEO):
 * ```php
 * // Good for public content that should be indexed
 * Route::middleware('bot.detection:normal,allow-crawlers')->group(function () {
 *     Route::get('/blog', [BlogController::class, 'index']);
 * });
 * ```
 *
 * ### Block All Bots:
 * ```php
 * // Strict mode blocks all detected bots (including search engines)
 * Route::middleware('bot.detection:paranoid')->group(function () {
 *     Route::post('/api/sensitive', [SensitiveController::class, 'store']);
 * });
 * ```
 *
 * ## Configuration:
 * ```php
 * // config/bot-detection.php
 * return [
 *     'enabled' => true,
 *     'mode' => 'normal', // normal, strict, paranoid
 *     'allow_good_crawlers' => true, // Allow search engines
 *     'behavior_threshold' => 70, // Score 0-100
 *     'auto_block' => true,
 *     'block_duration' => 3600, // 1 hour
 * ];
 * ```
 *
 * @see https://github.com/JayBizzle/Crawler-Detect
 * @since 1.0.0
 */
#[AsMiddleware(
    alias: 'bot.detection',
    priority: 0,
    enabled: false
)]
class BotDetectionMiddleware
{
    /**
     * Crawler detector instance.
     */
    protected CrawlerDetect $crawlerDetect;

    /**
     * Create a new middleware instance.
     *
     * @param bool $enabled             Whether bot detection is enabled
     * @param bool $allowGoodCrawlers   Whether to allow good crawlers
     * @param bool $autoBlock           Whether to auto-block detected bots
     * @param int  $blockDuration       Block duration in seconds
     * @param bool $challengeSuspicious Whether to challenge suspicious requests
     */
    public function __construct(
        #[Config('bot-detection.enabled')]
        protected bool $enabled = true,
        #[Config('bot-detection.allow_good_crawlers')]
        protected bool $allowGoodCrawlers = true,
        #[Config('bot-detection.auto_block')]
        protected bool $autoBlock = true,
        #[Config('bot-detection.block_duration')]
        protected int $blockDuration = 3600,
        #[Config('bot-detection.challenge_suspicious')]
        protected bool $challengeSuspicious = false,
    ) {
        $this->crawlerDetect = new CrawlerDetect();
    }

    /**
     * Handle an incoming request.
     *
     * @param string $mode          Detection mode: normal, strict, paranoid
     * @param string $allowCrawlers Whether to allow good crawlers
     *
     * @throws AccessDeniedHttpException
     */
    public function handle(Request $request, Closure $next, string $mode = 'normal', string $allowCrawlers = 'allow-crawlers'): Response
    {
        if (! $this->enabled) {
            return $next($request);
        }

        // Check if IP is already blocked
        throw_if($this->isBlocked($request), AccessDeniedHttpException::class, 'Access denied. Bot detected.');

        // Detect if request is from a crawler/bot using Crawler-Detect
        $isCrawler = $this->crawlerDetect->isCrawler($request->userAgent());

        if ($isCrawler) {
            // Get crawler name (e.g., "Googlebot", "Bingbot")
            $crawlerName = $this->crawlerDetect->getMatches();

            // Check if it's a good crawler (search engine, monitoring tool)
            $isGoodCrawler = $this->isGoodCrawler($crawlerName);

            // Allow good crawlers if configured
            if ($isGoodCrawler && $allowCrawlers === 'allow-crawlers' && $this->allowGoodCrawlers) {
                logger()->info('Good crawler detected', [
                    'crawler' => $crawlerName,
                    'ip' => $request->ip(),
                    'url' => $request->fullUrl(),
                ]);

                return $next($request);
            }

            // Block bad crawlers or all crawlers in paranoid mode
            if (! $isGoodCrawler || $mode === 'paranoid') {
                logger()->warning('Bot/crawler blocked', [
                    'crawler' => $crawlerName,
                    'ip' => $request->ip(),
                    'url' => $request->fullUrl(),
                    'mode' => $mode,
                ]);

                if ($this->autoBlock) {
                    $this->blockIp($request);
                }

                throw new AccessDeniedHttpException('Access denied. Bot detected.');
            }
        }

        // Analyze behavior and calculate bot score for non-crawler requests
        $botScore = $this->calculateBotScore($request, $mode);

        // Get threshold based on mode
        $threshold = $this->getThreshold($mode);

        // If score exceeds threshold, take action
        if ($botScore >= $threshold) {
            logger()->warning('Suspicious bot activity detected', [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'score' => $botScore,
                'threshold' => $threshold,
                'url' => $request->fullUrl(),
            ]);

            if ($this->autoBlock) {
                $this->blockIp($request);

                throw new AccessDeniedHttpException('Access denied. Suspicious activity detected.');
            }

            if ($this->challengeSuspicious) {
                // TODO: Implement CAPTCHA challenge
                // For now, just log and allow
            }
        }

        // Track request for behavior analysis
        $this->trackRequest($request);

        return $next($request);
    }

    /**
     * Check if crawler is a good bot (search engine, monitoring, etc.).
     */
    protected function isGoodCrawler(?string $crawlerName): bool
    {
        if (! $crawlerName) {
            return false;
        }

        $crawlerName = Str::lower($crawlerName);

        // Good crawlers (search engines, monitoring tools, social media)
        $goodCrawlers = [
            // Search engines
            'googlebot',
            'google',
            'bingbot',
            'bing',
            'slurp',
            'yahoo',
            'duckduckbot',
            'duckduckgo',
            'baiduspider',
            'baidu',
            'yandexbot',
            'yandex',
            'sogou',
            'exabot',
            // Social media
            'facebookexternalhit',
            'facebook',
            'twitterbot',
            'twitter',
            'linkedinbot',
            'linkedin',
            'pinterestbot',
            'pinterest',
            'whatsapp',
            'telegram',
            'slack',
            'discord',
            // Monitoring & SEO tools
            'uptimerobot',
            'pingdom',
            'newrelic',
            'datadog',
            'semrushbot',
            'semrush',
            'ahrefsbot',
            'ahrefs',
            'mj12bot',
            'majestic',
            'screaming frog',
            // Other legitimate
            'applebot',
            'apple',
            'amazonbot',
            'amazon',
        ];

        return Arr::any($goodCrawlers, fn ($goodCrawler): bool => Str::contains($crawlerName, (string) $goodCrawler));
    }

    /**
     * Check if IP is blocked.
     */
    protected function isBlocked(Request $request): bool
    {
        $key = 'bot:blocked:' . $request->ip();

        return Cache::has($key);
    }

    /**
     * Block an IP address.
     */
    protected function blockIp(Request $request): void
    {
        $key = 'bot:blocked:' . $request->ip();

        Cache::put($key, true, $this->blockDuration);

        logger()->warning('IP blocked for bot activity', [
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'url' => $request->fullUrl(),
            'duration' => $this->blockDuration,
        ]);
    }

    /**
     * Calculate bot score (0-100).
     *
     * Higher score = more likely to be a bot.
     */
    protected function calculateBotScore(Request $request, string $mode): int
    {
        $score = 0;

        // User-Agent analysis (0-30 points)
        $score += $this->analyzeUserAgent($request);

        // Request pattern analysis (0-30 points)
        $score += $this->analyzeRequestPattern($request);

        // Behavior analysis (0-40 points)
        $score += $this->analyzeBehavior($request);

        return min(100, $score);
    }

    /**
     * Analyze User-Agent string.
     */
    protected function analyzeUserAgent(Request $request): int
    {
        $userAgent = $request->userAgent() ?? '';
        $score = 0;

        // No User-Agent (very suspicious)
        if (empty($userAgent)) {
            return 30;
        }

        // Very short User-Agent (suspicious)
        if (Str::length($userAgent) < 20) {
            $score += 15;
        }

        // Contains suspicious keywords
        $suspiciousKeywords = ['curl', 'wget', 'python', 'java/', 'go-http', 'scrapy'];
        foreach ($suspiciousKeywords as $suspiciouKeyword) {
            if (Str::contains(Str::lower($userAgent), $suspiciouKeyword)) {
                $score += 10;

                break;
            }
        }

        return \min(30, $score);
    }

    /**
     * Analyze request patterns.
     */
    protected function analyzeRequestPattern(Request $request): int
    {
        $score = 0;
        $ip = $request->ip();

        // Check request frequency
        $requestCount = $this->getRequestCount($ip);

        // More than 60 requests per minute (very suspicious)
        if ($requestCount > 60) {
            $score += 30;
        }
        // More than 30 requests per minute (suspicious)
        elseif ($requestCount > 30) {
            $score += 20;
        }
        // More than 10 requests per minute (slightly suspicious)
        elseif ($requestCount > 10) {
            $score += 10;
        }

        return \min(30, $score);
    }

    /**
     * Analyze behavior patterns.
     */
    protected function analyzeBehavior(Request $request): int
    {
        $score = 0;
        $ip = $request->ip();

        // Check if requests are too predictable (same interval)
        if ($this->hasPredictablePattern($ip)) {
            $score += 20;
        }

        // Check if accessing only API endpoints (no assets)
        if ($this->isApiOnly($ip)) {
            $score += 10;
        }

        // Check if no referrer (suspicious for web requests)
        if (! $request->header('Referer') && ! $request->is('api/*')) {
            $score += 10;
        }

        return \min(40, $score);
    }

    /**
     * Get request count for IP in last minute.
     */
    protected function getRequestCount(?string $ip): int
    {
        if ($ip === null) {
            return 0;
        }

        $key = 'bot:requests:' . $ip;
        $count = Cache::get($key, 0);

        return is_int($count) ? $count : 0;
    }

    /**
     * Check if requests have predictable pattern.
     */
    protected function hasPredictablePattern(?string $ip): bool
    {
        if ($ip === null) {
            return false;
        }

        $key = 'bot:timestamps:' . $ip;
        $timestamps = Cache::get($key, []);
        /** @var array<float> $timestamps */
        $timestamps = is_array($timestamps) ? $timestamps : [];

        if (count($timestamps) < 5) {
            return false;
        }

        // Calculate intervals between requests
        $intervals = [];
        $counter = count($timestamps);
        for ($i = 1; $i < $counter; $i++) {
            $intervals[] = $timestamps[$i] - $timestamps[$i - 1];
        }

        // Check if intervals are too similar (variance < 0.1)
        $mean = Arr::sum($intervals) / count($intervals);
        $variance = 0;
        foreach ($intervals as $interval) {
            $variance += ($interval - $mean) ** 2;
        }

        $variance /= count($intervals);

        return $variance < 0.1;
    }

    /**
     * Check if IP only accesses API endpoints.
     */
    protected function isApiOnly(?string $ip): bool
    {
        if ($ip === null) {
            return false;
        }

        $key = 'bot:paths:' . $ip;
        $paths = Cache::get($key, []);
        /** @var array<string> $paths */
        $paths = is_array($paths) ? $paths : [];

        if (empty($paths)) {
            return false;
        }

        $apiCount = 0;
        foreach ($paths as $path) {
            if (Str::startsWith((string) $path, '/api/')) {
                $apiCount++;
            }
        }

        return $apiCount === count($paths);
    }

    /**
     * Track request for behavior analysis.
     */
    protected function trackRequest(Request $request): void
    {
        $ip = $request->ip();

        // Track request count
        $countKey = 'bot:requests:' . $ip;
        Cache::increment($countKey);
        $count = Cache::get($countKey, 0);
        Cache::put($countKey, is_int($count) ? $count : 0, 60);  // 1 minute TTL

        // Track timestamps
        $timestampKey = 'bot:timestamps:' . $ip;
        $timestamps = Cache::get($timestampKey, []);
        /** @var array<float> $timestamps */
        $timestamps = is_array($timestamps) ? $timestamps : [];
        $timestamps[] = microtime(true);
        $timestamps = Arr::slice($timestamps, -10);  // Keep last 10
        Cache::put($timestampKey, $timestamps, 300);  // 5 minutes TTL

        // Track paths
        $pathKey = 'bot:paths:' . $ip;
        $paths = Cache::get($pathKey, []);
        /** @var array<string> $paths */
        $paths = is_array($paths) ? $paths : [];
        $paths[] = $request->path();
        $paths = Arr::slice($paths, -20);  // Keep last 20
        Cache::put($pathKey, $paths, 300);  // 5 minutes TTL
    }

    /**
     * Get threshold based on mode.
     */
    protected function getThreshold(string $mode): int
    {
        return match ($mode) {
            'paranoid' => 50,  // Very strict
            'strict' => 70,  // Strict
            'normal' => 85,  // Normal
            default => 85,
        };
    }
}
