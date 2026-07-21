<?php

declare(strict_types=1);

/**
 * Debugbar Service
 *
 * Core service providing Debugbar operations for the Telemetry module.
 * Encapsulates business logic and coordinates with repositories and external systems.
 *
 * @category Services
 *
 * @since    1.0.0
 */
namespace Stackra\Debugbar\Services;

use Barryvdh\Debugbar\LaravelDebugbar;
use Illuminate\Support\Facades\App;
use Stackra\Contracts\Telemetry\Debugbar\DebugbarService as DebugbarServiceContracts;
use Throwable;

/**
 * Debugbar Service.
 *
 * Provides helper methods for interacting with Laravel Debugbar.
 *
 * ## Purpose:
 * This service provides a convenient API for adding messages, measuring
 * performance, and collecting custom data in Debugbar. It acts as a facade
 * to the underlying Debugbar instance with additional safety checks.
 *
 * ## Features:
 * - ✅ Add debug messages with different severity levels
 * - ✅ Measure execution time of code blocks
 * - ✅ Add custom data to Debugbar
 * - ✅ Start/stop timers for performance tracking
 * - ✅ Add exceptions for error tracking
 * - ✅ Add timeline events
 * - ✅ Safe operation when Debugbar is disabled
 *
 * ## Binding:
 * This service is automatically bound to its interface using the #[Bind] attribute.
 * You can inject the interface in your classes:
 *
 * ```php
 * use Stackra\Debugbar\Contracts\DebugbarService;
 *
 * class MyService
 * {
 *     public function __construct(
 *         private DebugbarService $debugbar
 *     ) {}
 * }
 * ```
 *
 * ## Usage:
 * ```php
 * use Stackra\Debugbar\Services\DebugbarService;
 *
 * // Add a message
 * DebugbarService::info('Processing user data');
 *
 * // Measure execution time
 * DebugbarService::startMeasure('process', 'Processing data');
 * // ... do work ...
 * DebugbarService::stopMeasure('process');
 *
 * // Measure callback
 * $result = DebugbarService::measure('query', function () {
 *     return User::all();
 * }, 'Fetching users');
 *
 * // Add custom data
 * DebugbarService::addMessage(['user_id' => 123], 'custom');
 * ```
 *
 * ## Safety:
 * All methods safely handle the case where Debugbar is not enabled or not
 * available. They will silently return without throwing exceptions.
 *
 * @since 1.0.0
 */
class DebugbarService implements DebugbarServiceContracts
{
    /**
     * Add an info message to Debugbar.
     *
     * Info messages are used for general information and debugging output.
     * They appear in the Messages tab with an info icon.
     *
     * ## Example:
     * ```php
     * DebugbarService::info('User logged in successfully');
     * DebugbarService::info('Cache hit for key: users', 'cache');
     * ```
     *
     * @param string $message The message to add
     * @param string $label   Optional label for the message (default: 'info')
     */
    public static function info(string $message, string $label = 'info'): void
    {
        $debugbar = self::getDebugbar();
        if (! $debugbar instanceof LaravelDebugbar) {
            return;
        }

        $debugbar->info($message, $label);
    }

    /**
     * Add a warning message to Debugbar.
     *
     * Warning messages indicate potential issues that don't prevent execution
     * but should be reviewed. They appear with a warning icon.
     *
     * ## Example:
     * ```php
     * DebugbarService::warning('Cache miss for key: users');
     * DebugbarService::warning('Deprecated method called', 'deprecation');
     * ```
     *
     * @param string $message The message to add
     * @param string $label   Optional label for the message (default: 'warning')
     */
    public static function warning(string $message, string $label = 'warning'): void
    {
        $debugbar = self::getDebugbar();
        if (! $debugbar instanceof LaravelDebugbar) {
            return;
        }

        $debugbar->warning($message, $label);
    }

    /**
     * Add an error message to Debugbar.
     *
     * Error messages indicate problems that occurred during execution.
     * They appear with an error icon and are highlighted in red.
     *
     * ## Example:
     * ```php
     * DebugbarService::error('Failed to connect to database');
     * DebugbarService::error('Invalid configuration', 'config');
     * ```
     *
     * @param string $message The message to add
     * @param string $label   Optional label for the message (default: 'error')
     */
    public static function error(string $message, string $label = 'error'): void
    {
        $debugbar = self::getDebugbar();
        if (! $debugbar instanceof LaravelDebugbar) {
            return;
        }

        $debugbar->error($message, $label);
    }

    /**
     * Add a custom message to Debugbar.
     *
     * This method allows adding any type of data (string, array, object)
     * to Debugbar with a custom label. The data will be displayed in the
     * Messages tab.
     *
     * ## Example:
     * ```php
     * DebugbarService::addMessage('Simple message');
     * DebugbarService::addMessage(['user_id' => 123, 'action' => 'login'], 'auth');
     * DebugbarService::addMessage($user, 'user_data');
     * ```
     *
     * @param mixed  $message The message to add (can be any type)
     * @param string $label   Optional label for the message (default: 'messages')
     */
    public static function addMessage($message, string $label = 'messages'): void
    {
        $debugbar = self::getDebugbar();
        if (! $debugbar instanceof LaravelDebugbar) {
            return;
        }

        $debugbar->addMessage($message, $label);
    }

    /**
     * Start measuring execution time.
     *
     * Starts a timer with a unique name. Use stopMeasure() to stop the timer
     * and record the elapsed time. The measurement will appear in the Timeline tab.
     *
     * ## Example:
     * ```php
     * DebugbarService::startMeasure('database-query', 'Fetching users');
     * $users = User::all();
     * DebugbarService::stopMeasure('database-query');
     * ```
     *
     * @param string      $name  Unique name for the measure
     * @param string|null $label Optional label for the measure (shown in Timeline)
     */
    public static function startMeasure(string $name, ?string $label = null): void
    {
        $debugbar = self::getDebugbar();
        if (! $debugbar instanceof LaravelDebugbar) {
            return;
        }

        $debugbar->startMeasure($name, $label);
    }

    /**
     * Stop measuring execution time.
     *
     * Stops a timer that was started with startMeasure() and records the
     * elapsed time. The measurement will appear in the Timeline tab.
     *
     * ## Example:
     * ```php
     * DebugbarService::startMeasure('process');
     * // ... do work ...
     * DebugbarService::stopMeasure('process');
     * ```
     *
     * @param string $name The name of the measure to stop
     */
    public static function stopMeasure(string $name): void
    {
        $debugbar = self::getDebugbar();
        if (! $debugbar instanceof LaravelDebugbar) {
            return;
        }

        $debugbar->stopMeasure($name);
    }

    /**
     * Measure execution time of a callback.
     *
     * Convenience method that measures the execution time of a callback
     * and returns its result. This is equivalent to calling startMeasure(),
     * executing the callback, and calling stopMeasure().
     *
     * ## Example:
     * ```php
     * $users = DebugbarService::measure('fetch-users', function () {
     *     return User::all();
     * }, 'Fetching all users');
     * ```
     *
     * @param  string      $name     Unique name for the measure
     * @param  callable    $callback The callback to measure
     * @param  string|null $label    Optional label for the measure
     * @return mixed       The return value of the callback
     */
    public static function measure(string $name, callable $callback, ?string $label = null)
    {
        // Start measuring
        self::startMeasure($name, $label);

        // Execute callback
        $result = $callback();

        // Stop measuring
        self::stopMeasure($name);

        return $result;
    }

    /**
     * Add an exception to Debugbar.
     *
     * Adds an exception to the Exceptions tab in Debugbar. This is useful
     * for tracking caught exceptions that don't prevent execution but
     * should be reviewed.
     *
     * ## Example:
     * ```php
     * try {
     *     // Some code
     * } catch (\Exception $e) {
     *     DebugbarService::addException($e);
     *     // Handle exception
     * }
     * ```
     *
     * @param Throwable $throwable The exception to add
     */
    public static function addException(Throwable $throwable): void
    {
        $debugbar = self::getDebugbar();
        if (! $debugbar instanceof LaravelDebugbar) {
            return;
        }

        $debugbar->addException($throwable);
    }

    /**
     * Add a timeline event.
     *
     * Adds a custom event to the Timeline tab. This is useful for tracking
     * specific points in time or duration of custom operations.
     *
     * ## Example:
     * ```php
     * $start = microtime(true);
     * // ... do work ...
     * $end = microtime(true);
     * DebugbarService::addTimelineEvent('custom-process', 'Processing data', $start, $end);
     * ```
     *
     * @param string      $name  Event name
     * @param string|null $label Optional label (shown in Timeline)
     * @param string|null $start Optional start time (microtime)
     * @param string|null $end   Optional end time (microtime)
     */
    public static function addTimelineEvent(
        string $name,
        ?string $label = null,
        ?string $start = null,
        ?string $end = null
    ): void {
        $debugbar = self::getDebugbar();
        if (! $debugbar instanceof LaravelDebugbar) {
            return;
        }

        // Get the time collector
        $timeCollector = $debugbar['time'];

        // Add the measure to the timeline
        $timeCollector->addMeasure(
            $label ?? $name,
            $start ?? microtime(true),
            $end ?? microtime(true)
        );
    }

    /**
     * Check if Debugbar is enabled.
     *
     * Returns true if Debugbar is enabled and available, false otherwise.
     * This is useful for conditionally adding debug information only when
     * Debugbar is active.
     *
     * ## Example:
     * ```php
     * if (DebugbarService::isEnabled()) {
     *     DebugbarService::info('Debug information');
     * }
     * ```
     *
     * @return bool True if Debugbar is enabled, false otherwise
     */
    public static function isEnabled(): bool
    {
        return self::getDebugbar() instanceof LaravelDebugbar;
    }

    /**
     * Get the Debugbar instance.
     *
     * Returns the Laravel Debugbar instance if it's bound in the container,
     * or null if Debugbar is not available or disabled.
     *
     * @return LaravelDebugbar|null The Debugbar instance or null
     */
    protected static function getDebugbar(): ?LaravelDebugbar
    {
        // Check if Debugbar is bound in the container
        if (! App::bound('debugbar')) {
            return null;
        }

        return App::make('debugbar');
    }
}
