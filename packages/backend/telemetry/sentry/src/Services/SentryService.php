<?php

declare(strict_types=1);

/**
 * Sentry Service
 *
 * Core service providing Sentry operations for the Telemetry module.
 * Encapsulates business logic and coordinates with repositories and external systems.
 *
 * @category Services
 *
 * @since    1.0.0
 */
namespace Academorix\Sentry\Services;

use Illuminate\Container\Attributes\Scoped;
use Illuminate\Support\Facades\Auth;
use Academorix\Attributes\Attributes\Parameters\Config;
use Academorix\Foundation\Enums\ContainerToken;
use Academorix\Support\Arr;
use Academorix\Support\Reflection;

use function Sentry\addBreadcrumb;

use Sentry\Breadcrumb;

use function Sentry\captureException;
use function Sentry\captureMessage;
use function Sentry\configureScope;

use Sentry\Severity;
use Sentry\State\Scope;
use Throwable;

/**
 * Sentry Service.
 *
 * Provides a convenient wrapper around Sentry SDK for error tracking,
 * performance monitoring, and context management.
 *
 * ## Features:
 * - User context tracking
 * - Request context tracking
 * - Custom tags and context
 * - Breadcrumb tracking
 * - Message capture
 * - Exception capture
 *
 * ## Usage:
 * ```php
 * // Configure scope with user and request context
 * SentryService::configureScope();
 *
 * // Add breadcrumb
 * SentryService::addBreadcrumb('User clicked checkout button', [
 *     'cart_total' => 99.99,
 *     'items_count' => 3,
 * ], 'user_action');
 *
 * // Capture message
 * SentryService::captureMessage('Payment processing started', 'info');
 *
 * // Capture exception
 * try {
 *     // risky code
 * } catch (Exception $e) {
 *     SentryService::captureException($e);
 * }
 * ```
 */
#[Scoped]
class SentryService
{
    /**
     * Singleton instance.
     */
    private static ?self $instance = null;

    /**
     * Create a new SentryService instance.
     *
     * @param string|null $sentryDsn The Sentry DSN configuration
     */
    public function __construct(
        #[Config('sentry.dsn')]
        protected readonly ?string $sentryDsn = null,
    ) {}

    /**
     * Check if Sentry is enabled and configured.
     *
     * @return bool True if Sentry is available
     */
    public static function isEnabled(): bool
    {
        return app()->bound(ContainerToken::SENTRY->value) && self::getInstance()->sentryDsn !== null;
    }

    /**
     * Configure Sentry scope with user and context.
     *
     * This method sets up the Sentry scope with:
     * - User information (if authenticated)
     * - Environment tags
     * - Request context
     * - Custom application context
     *
     * Call this at the beginning of a request or before capturing exceptions
     * to ensure all context is included.
     */
    public static function configureScope(): void
    {
        if (! self::isEnabled()) {
            return;
        }

        configureScope(function (Scope $scope): void {
            // Set user context if authenticated
            if (Auth::check()) {
                $user = Auth::user();
                if ($user) {
                    $scope->setUser([
                        'id' => $user->id,
                        'email' => $user->email ?? null,
                        'username' => $user->name ?? null,
                    ]);
                }
            }

            // Set environment tags
            $scope->setTag('environment', (string) app()->environment());
            $scope->setTag('php_version', PHP_VERSION);
            $scope->setTag('laravel_version', (string) app()->version());

            // Set request context
            $request = request();
            if ($request) {
                $scope->setTag('request_method', $request->method());
                $scope->setTag('request_path', $request->path());

                $scope->setContext('request', [
                    'url' => $request->fullUrl(),
                    'method' => $request->method(),
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'request_id' => $request->header('X-Request-ID'),
                ]);
            }
        });
    }

    /**
     * Add a breadcrumb to Sentry.
     *
     * Breadcrumbs are a trail of events that happened before an error.
     * They help you understand what led to the error.
     *
     * @param string               $message  Breadcrumb message
     * @param array<string, mixed> $data     Additional data
     * @param string               $category Category (e.g., 'navigation', 'http', 'user_action')
     * @param string               $level    Level (info, warning, error)
     */
    public static function addBreadcrumb(
        string $message,
        array $data = [],
        string $category = 'default',
        string $level = 'info'
    ): void {
        if (! self::isEnabled()) {
            return;
        }

        $breadcrumbLevel = match ($level) {
            'debug' => Breadcrumb::LEVEL_DEBUG,
            'info' => Breadcrumb::LEVEL_INFO,
            'warning' => Breadcrumb::LEVEL_WARNING,
            'error' => Breadcrumb::LEVEL_ERROR,
            'fatal' => Breadcrumb::LEVEL_FATAL,
            default => Breadcrumb::LEVEL_INFO,
        };

        $breadcrumb = new Breadcrumb(
            level: $breadcrumbLevel,
            type: Breadcrumb::TYPE_DEFAULT,
            category: $category,
            message: $message,
            metadata: $data
        );

        addBreadcrumb($breadcrumb);
    }

    /**
     * Capture a message to Sentry.
     *
     * Use this for logging important events that aren't exceptions.
     *
     * @param string $message Message to capture
     * @param string $level   Severity level (debug, info, warning, error, fatal)
     */
    public static function captureMessage(string $message, string $level = 'info'): void
    {
        if (! self::isEnabled()) {
            return;
        }

        $severity = match ($level) {
            'debug' => Severity::debug(),
            'info' => Severity::info(),
            'warning' => Severity::warning(),
            'error' => Severity::error(),
            'fatal' => Severity::fatal(),
            default => Severity::info(),
        };

        captureMessage($message, $severity);
    }

    /**
     * Capture an exception to Sentry.
     *
     * This method configures the scope and captures the exception.
     * Use this when you want to manually report an exception.
     *
     * @param Throwable $throwable The exception to capture
     */
    public static function captureException(Throwable $throwable): void
    {
        if (! self::isEnabled()) {
            return;
        }

        self::configureScope();
        captureException($throwable);
    }

    /**
     * Set a custom tag in Sentry scope.
     *
     * Tags are key-value pairs that help you filter and search errors.
     *
     * @param string $key   Tag key
     * @param string $value Tag value
     */
    public static function setTag(string $key, string $value): void
    {
        if (! self::isEnabled()) {
            return;
        }

        configureScope(function (Scope $scope) use ($key, $value): void {
            $scope->setTag($key, $value);
        });
    }

    /**
     * Set custom context in Sentry scope.
     *
     * Context provides additional structured data about the error.
     *
     * @param string               $key  Context key
     * @param array<string, mixed> $data Context data
     */
    public static function setContext(string $key, array $data): void
    {
        if (! self::isEnabled()) {
            return;
        }

        configureScope(function (Scope $scope) use ($key, $data): void {
            $scope->setContext($key, $data);
        });
    }

    /**
     * Set user context in Sentry scope.
     *
     * @param int|string           $id       User ID
     * @param string|null          $email    User email
     * @param string|null          $username User username
     * @param array<string, mixed> $extra    Additional user data
     */
    public static function setUser(
        int|string $id,
        ?string $email = null,
        ?string $username = null,
        array $extra = []
    ): void {
        if (! self::isEnabled()) {
            return;
        }

        configureScope(function (Scope $scope) use ($id, $email, $username, $extra): void {
            $scope->setUser(Arr::merge([
                'id' => $id,
                'email' => $email,
                'username' => $username,
            ], $extra));
        });
    }

    /**
     * Get the singleton instance.
     */
    protected static function getInstance(): self
    {
        if (! self::$instance instanceof self || ! Reflection::implements(self::$instance, self::class)) {
            self::$instance = resolve(self::class);
        }

        return self::$instance;
    }
}
