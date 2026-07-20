<?php

declare(strict_types=1);

/**
 * Environment Context Provider.
 *
 * Adds environment and application metadata to Nightwatch via
 * `Context::add('environment', [...])`. Provides foundational
 * context that other providers may depend on.
 *
 * ## Context Added
 * - app_name, environment, php_version, laravel_version
 *
 * ## Octane Safety
 * ✅ Safe — reads from global config and constants only.
 *
 * @category Contexts
 *
 * @since    1.0.0
 */

namespace Academorix\Nightwatch\Contexts;

use Illuminate\Container\Attributes\Config;
use Academorix\Nightwatch\Attributes\AsNightwatchContext;
use Academorix\Nightwatch\Contracts\NightwatchContext;

/**
 * Provides environment metadata as Nightwatch context.
 *
 * Highest priority (1000) so environment data is always available
 * before any other context providers execute.
 */
#[AsNightwatchContext(description: 'Adds environment and application metadata')]
class EnvironmentContext implements NightwatchContext
{
    /**
     * Create a new environment context instance.
     *
     * @param string $appName Application name from config('app.name').
     */
    public function __construct(
        #[Config('app.name')]
        protected readonly string $appName,
    ) {}

    /**
     * {@inheritDoc}
     */
    public function key(): string
    {
        return 'environment';
    }

    /**
     * {@inheritDoc}
     */
    public function data(): array
    {
        return [
            'app_name' => $this->appName,
            'environment' => (string) app()->environment(),
            'php_version' => PHP_VERSION,
            'laravel_version' => (string) app()->version(),
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function priority(): int
    {
        return 1000;
    }
}
