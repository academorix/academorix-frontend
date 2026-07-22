<?php

declare(strict_types=1);

/**
 * Request Size Limit Middleware
 *
 * Request middleware that transforms or validates incoming HTTP requests.
 * Processes the request before it reaches the controller layer.
 *
 * @category Middleware
 *
 * @since    1.0.0
 */
namespace Stackra\Foundation\Middleware;

use Closure;
use Illuminate\Container\Attributes\Config;
use Illuminate\Http\Request;
use Stackra\Foundation\Exceptions\BadRequestException;
use Stackra\Routing\Attributes\AsMiddleware;
use Stackra\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Request Size Limit Middleware.
 *
 * Enforces maximum request body size limits to protect against large payload
 * attacks and ensure server resources are not exhausted. This middleware
 * validates request size before processing, preventing memory issues and
 * improving application security.
 *
 * ## Why Limit Request Size?
 * - **Security**: Prevent DoS attacks via large payloads
 * - **Performance**: Avoid memory exhaustion
 * - **Resource Management**: Control server resource usage
 * - **Cost Control**: Limit bandwidth consumption
 *
 * ## Features:
 * - Configurable size limits
 * - Per-route custom limits
 * - Human-readable size formats (KB, MB, GB)
 * - Clear error messages with size information
 * - Bypass for specific routes
 *
 * ## Configuration:
 * ```php
 * // config/foundation.php
 * 'request' => [
 *     'max_size' => '10M', // 10 megabytes
 * ],
 * ```
 *
 * ## Environment Variables:
 * ```env
 * REQUEST_MAX_SIZE=10M
 * ```
 *
 * ## Usage:
 *
 * ### Global Middleware (All Routes):
 * ```php
 * // In app/Http/Kernel.php
 * protected $middleware = [
 *     \Stackra\Foundation\Middleware\RequestSizeLimitMiddleware::class,
 * ];
 * ```
 *
 * ### API Routes:
 * ```php
 * Route::middleware('request.size')->group(function () {
 *     Route::post('/api/users', [UserController::class, 'store']);
 * });
 * ```
 *
 * ### Custom Size Limit:
 * ```php
 * // Allow 50MB for file uploads
 * Route::middleware('request.size:50M')->group(function () {
 *     Route::post('/api/files/upload', [FileController::class, 'upload']);
 * });
 *
 * // Strict 1MB limit for text data
 * Route::middleware('request.size:1M')->group(function () {
 *     Route::post('/api/comments', [CommentController::class, 'store']);
 * });
 * ```
 *
 * ## Size Format:
 * Supports human-readable formats:
 * - `1024` or `1024B`: Bytes
 * - `10K` or `10KB`: Kilobytes
 * - `5M` or `5MB`: Megabytes
 * - `1G` or `1GB`: Gigabytes
 *
 * ## Examples:
 *
 * ### Small API Requests (1MB):
 * ```php
 * Route::middleware('request.size:1M')->post('/api/users', ...);
 * ```
 *
 * ### Medium File Uploads (50MB):
 * ```php
 * Route::middleware('request.size:50M')->post('/api/documents', ...);
 * ```
 *
 * ### Large File Uploads (500MB):
 * ```php
 * Route::middleware('request.size:500M')->post('/api/videos', ...);
 * ```
 *
 * ## Error Response:
 * ```json
 * {
 *   "success": false,
 *   "error": {
 *     "code": "REQUEST_TOO_LARGE",
 *     "message": "Request body size exceeds maximum allowed size",
 *     "max_size": "10485760",
 *     "max_size_human": "10 MB",
 *     "actual_size": "15728640",
 *     "actual_size_human": "15 MB"
 *   }
 * }
 * ```
 *
 * ## Common Limits:
 * - **JSON API**: 1-10 MB
 * - **Form Data**: 5-20 MB
 * - **Image Upload**: 10-50 MB
 * - **Document Upload**: 50-100 MB
 * - **Video Upload**: 100-500 MB
 * - **Bulk Import**: 100-1000 MB
 *
 * ## Best Practices:
 * - Set appropriate limits based on use case
 * - Use smaller limits for API endpoints
 * - Use larger limits for file uploads
 * - Document size limits in API documentation
 * - Provide clear error messages
 * - Consider chunked uploads for large files
 * - Monitor request sizes in production
 *
 * ## Server Configuration:
 * Ensure server limits are also configured:
 *
 * ### PHP:
 * ```ini
 * post_max_size = 50M
 * upload_max_filesize = 50M
 * memory_limit = 256M
 * ```
 *
 * ### Nginx:
 * ```nginx
 * client_max_body_size 50M;
 * ```
 *
 * ### Apache:
 * ```apache
 * LimitRequestBody 52428800
 * ```
 *
 * ## Chunked Uploads:
 * For very large files, consider chunked uploads:
 * ```php
 * // Client splits file into chunks
 * // Each chunk is under size limit
 * // Server reassembles chunks
 * ```
 *
 * ## Security Considerations:
 * - Always validate file types
 * - Scan uploaded files for malware
 * - Store uploads outside web root
 * - Use signed URLs for downloads
 * - Implement rate limiting
 * - Monitor disk space usage
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/413
 * @since 1.0.0
 */
#[AsMiddleware(
    alias: 'request.size',
    priority: 5
)]
class RequestSizeLimitMiddleware
{
    /**
     * Default maximum request size in bytes (10 MB).
     */
    protected const DEFAULT_MAX_SIZE = 10485760;  // 10 * 1024 * 1024

    /**
     * Create a new middleware instance.
     *
     * @param string $defaultMaxSize Default maximum request size
     */
    public function __construct(
        #[Config('foundation.request.max_size')]
        protected string $defaultMaxSize = '10M',
    ) {}

    /**
     * Handle an incoming request.
     *
     * Validates that the request size does not exceed the configured limit.
     *
     * ## Process Flow:
     * 1. Get maximum allowed size (from parameter or config)
     * 2. Get actual request size from Content-Length header
     * 3. Compare sizes
     * 4. If exceeded, return 413 error
     * 5. Otherwise, continue to next middleware
     *
     * @param  Request                      $request The incoming HTTP request
     * @param  Closure(Request): (Response) $next    The next middleware in pipeline
     * @param  string|null                  $maxSize Maximum allowed size (optional)
     * @return Response                     The HTTP response
     *
     * @throws BadRequestException If request size exceeds limit
     */
    public function handle(Request $request, Closure $next, ?string $maxSize = null): Response
    {
        // Get maximum allowed size
        $maxSizeBytes = $this->parseSize($maxSize ?? $this->defaultMaxSize);

        // Get actual request size from Content-Length header
        $contentLength = $request->header('Content-Length');

        // If Content-Length is not provided, we can't validate
        // Let the request proceed (server will handle if too large)
        if ($contentLength === null) {
            return $next($request);
        }

        $actualSize = (int) $contentLength;

        // Check if request size exceeds limit
        if ($actualSize > $maxSizeBytes) {
            throw new BadRequestException(
                Str::format(
                    'Request body size (%s) exceeds maximum allowed size (%s)',
                    $this->formatSize($actualSize),
                    $this->formatSize($maxSizeBytes)
                )
            );
        }

        return $next($request);
    }

    /**
     * Parse size string to bytes.
     *
     * Converts human-readable size formats to bytes.
     *
     * ## Supported Formats:
     * - `1024` or `1024B`: Bytes
     * - `10K` or `10KB`: Kilobytes (1024 bytes)
     * - `5M` or `5MB`: Megabytes (1024 KB)
     * - `1G` or `1GB`: Gigabytes (1024 MB)
     *
     * @param  string $size The size string
     * @return int    The size in bytes
     */
    protected function parseSize(string $size): int
    {
        $size = trim($size);

        // If already in bytes (numeric only)
        if (is_numeric($size)) {
            return (int) $size;
        }

        // Extract number and unit
        if (! preg_match('/^(\d+(?:\.\d+)?)\s*([KMGT]?B?)$/i', $size, $matches)) {
            // Invalid format, return default
            return self::DEFAULT_MAX_SIZE;
        }

        $number = (float) $matches[1];
        $unit = strtoupper($matches[2]);

        // Convert to bytes based on unit
        return match ($unit) {
            'K', 'KB' => (int) ($number * 1024),
            'M', 'MB' => (int) ($number * 1024 * 1024),
            'G', 'GB' => (int) ($number * 1024 * 1024 * 1024),
            'T', 'TB' => (int) ($number * 1024 * 1024 * 1024 * 1024),
            default => (int) $number,  // Bytes
        };
    }

    /**
     * Format bytes to human-readable size.
     *
     * Converts bytes to the most appropriate unit.
     *
     * @param  int    $bytes The size in bytes
     * @return string The formatted size
     */
    protected function formatSize(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $power = $bytes > 0 ? floor(log($bytes, 1024)) : 0;
        $power = min($power, count($units) - 1);

        $size = $bytes / (1024 ** $power);

        return Str::format('%.2f %s', $size, $units[$power]);
    }
}
