<?php


/**
 * Sanitize Input Middleware
 *
 * Request middleware that transforms or validates incoming HTTP requests.
 * Processes the request before it reaches the controller layer.
 *
 * @category Middlewares
 *
 * @since    1.0.0
 */
namespace Academorix\Foundation\Middlewares\Request;

use function chr;

use Closure;

use function htmlspecialchars;

use Illuminate\Http\Request;

use function in_array;
use function is_array;
use function is_string;

use Academorix\Routing\Attributes\AsMiddleware;
use Academorix\Support\Str;

use function strip_tags;

use Symfony\Component\HttpFoundation\Response;

/**
 * Sanitize Input Middleware.
 *
 * Sanitizes all incoming request data to prevent XSS (Cross-Site Scripting)
 * and other injection attacks by removing potentially dangerous characters
 * and HTML tags from user input.
 *
 * ## Security Features:
 * - Removes null bytes (prevents null byte injection)
 * - Strips HTML tags (prevents XSS attacks)
 * - Converts special characters to HTML entities
 * - Trims whitespace
 * - Recursive sanitization for nested arrays
 *
 * ## What Gets Sanitized:
 * - All request input (GET, POST, PUT, PATCH, DELETE)
 * - Query parameters
 * - Request body
 * - Nested arrays and objects
 *
 * ## What Doesn't Get Sanitized:
 * - Password fields (preserved for hashing)
 * - Fields in the $except array
 * - File uploads (handled separately)
 *
 * ## Example:
 * ```php
 * // Input:
 * ['name' => '<script>alert("XSS")</script>John']
 *
 * // After sanitization:
 * ['name' => 'John']
 * ```
 *
 * ## Performance:
 * - Minimal overhead for small payloads
 * - May impact performance with large nested arrays
 * - Consider disabling for file upload endpoints
 *
 * ## Security Note:
 * This is a defense-in-depth measure. Always validate and sanitize
 * data at multiple layers (input, business logic, output).
 *
 * @since 1.0.0
 */
#[AsMiddleware(
    alias: 'sanitize',
    groups: ['api', 'web'],
    priority: 55
)]
class SanitizeInput
{
    /**
     * Fields that should not be sanitized.
     *
     * These fields are excluded from sanitization to preserve their original values.
     * Typically includes password fields that need to be hashed as-is.
     *
     * @var array<string>
     */
    protected array $except = [
        'password',
        'password_confirmation',
        'current_password',
    ];

    /**
     * Handle an incoming request.
     *
     * Sanitizes all input data before passing the request to the next middleware.
     *
     * ## Process:
     * 1. Get all request input
     * 2. Recursively sanitize all values
     * 3. Merge sanitized data back into request
     * 4. Update query parameters separately (for libraries that read from query bag)
     * 5. Continue to next middleware
     *
     * @param  Request                      $request The incoming HTTP request
     * @param  Closure(Request): (Response) $next    The next middleware in the pipeline
     * @return Response                     The HTTP response
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get all input data (query params, body, etc.)
        $input = $request->all();

        // Sanitize all input recursively
        $sanitized = $this->sanitize($input);

        // Merge sanitized data back into the request
        // This replaces the original input with sanitized values
        $request->merge($sanitized);

        // Also update the query bag specifically for libraries that read from it
        // (like Laravel Purity which uses request()->query('filters'))
        $queryParams = $request->query->all();
        if ($queryParams !== []) {
            $sanitizedQuery = $this->sanitize($queryParams);
            $request->query->replace($sanitizedQuery);
        }

        return $next($request);
    }

    /**
     * Sanitize the given data recursively.
     *
     * Handles arrays, strings, and other data types appropriately.
     * Recursively processes nested arrays to sanitize all values.
     *
     * @param  mixed       $data The data to sanitize (can be array, string, or other)
     * @param  string|null $key  The key of the current data (for checking except list)
     * @return mixed       The sanitized data
     */
    protected function sanitize($data, $key = null)
    {
        // Skip fields in the except list (e.g., passwords)
        if ($key !== null && in_array($key, $this->except, true)) {
            return $data;
        }

        // Handle arrays recursively
        if (is_array($data)) {
            $result = [];
            foreach ($data as $itemKey => $value) {
                // Ensure key is string for sanitize method
                $stringKey = is_string($itemKey) ? $itemKey : null;
                $result[$itemKey] = $this->sanitize($value, $stringKey);
            }

            return $result;
        }

        // Handle strings with sanitization rules
        if (is_string($data)) {
            return $this->sanitizeString($data);
        }

        // Return other types as-is (numbers, booleans, null, etc.)
        return $data;
    }

    /**
     * Sanitize a string value.
     *
     * Applies sanitization rules to remove potentially dangerous content:
     * 1. Remove null bytes (prevents null byte injection)
     * 2. Remove script/style tags and their content (prevents XSS)
     * 3. Strip remaining HTML tags (prevents XSS)
     * 4. Convert special characters to HTML entities
     * 5. Trim whitespace (clean up input)
     *
     * @param  string $value The string to sanitize
     * @return string The sanitized string
     */
    protected function sanitizeString(string $value): string
    {
        // Remove null bytes (chr(0))
        // Null bytes can be used to bypass security filters
        $value = Str::replace(chr(0), '', $value);

        // Remove script and style tags along with their content
        // This prevents XSS attacks by removing executable code
        $value = preg_replace('/<script\b[^>]*>.*?<\/script>/is', '', $value);
        $value = preg_replace('/<style\b[^>]*>.*?<\/style>/is', '', (string) $value);

        // Strip remaining HTML tags (but keep their content)
        // This removes formatting tags like <b>, <i>, etc.
        $value = strip_tags((string) $value);

        // Convert special characters to HTML entities
        // This converts <, >, &, ", ' to their HTML entity equivalents
        // ENT_QUOTES: Convert both double and single quotes
        // ENT_HTML5: Use HTML5 entities
        // UTF-8: Character encoding
        // false: Don't double-encode existing entities
        $value = htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8', false);

        // Trim leading and trailing whitespace
        // Cleans up user input and prevents whitespace-based attacks
        $value = Str::trim($value);

        return $value;
    }
}
