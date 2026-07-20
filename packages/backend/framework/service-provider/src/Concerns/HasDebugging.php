<?php

declare(strict_types=1);

/**
 * HasDebugging Trait.
 *
 * Provides conditional debug logging for module service providers.
 * Messages are prefixed with [Module: {ModuleName}] for easy filtering
 * in log files.
 *
 * Debug mode is enabled when either:
 *   - The provider's `$debug` property is true, OR
 *   - The application's `config('app.debug')` is true.
 *
 * When disabled, `debugLog()` returns immediately with zero overhead —
 * no string formatting, no logger calls.
 *
 * @category Concerns
 *
 * @since    1.0.0
 */

namespace Academorix\ServiceProvider\Concerns;

/**
 * Conditional debug logging for module service providers.
 *
 * Usage:
 *   $this->debugLog('Loaded migrations', ['count' => 5]);
 *
 * Enable per-module debugging in production:
 *   protected bool $debug = true;
 */
trait HasDebugging
{
    /**
     * Enable debug logging for this specific module.
     *
     * When true, debug messages are logged regardless of the application's
     * debug mode. Useful for troubleshooting a specific module in production.
     */
    protected bool $debug = false;

    /**
     * Cached application debug mode flag.
     *
     * Resolved once from config('app.debug') on first debugLog() call
     * to avoid repeated config lookups.
     */
    private bool $debugMode = false;

    /**
     * Whether the debug mode has been resolved from config.
     */
    private bool $debugModeResolved = false;

    /**
     * Log a debug message if debug mode is enabled.
     *
     * Messages are prefixed with [Module: {ModuleName}] for easy filtering.
     * The module name is read from `$this->resolvedModuleName` which is
     * populated by the ReadsAttributes trait during attribute resolution.
     *
     * When debug mode is disabled, this method returns immediately with
     * zero overhead — no string formatting, no logger calls.
     *
     * @param  string  $message  The debug message.
     * @param  array<string, mixed>  $context  Additional context data for structured logging.
     */
    protected function debugLog(string $message, array $context = []): void
    {
        // Lazy-resolve debug mode from config on first call
        if (! $this->debugModeResolved) {
            $this->debugMode = (bool) config('app.debug', false);
            $this->debugModeResolved = true;
        }

        // Short-circuit if debug is disabled — zero overhead
        if (! $this->debug && ! $this->debugMode) {
            return;
        }

        logger()->debug(
            '[Module: '.($this->resolvedModuleName ?: 'unknown').'] '.$message,
            $context,
        );
    }
}
