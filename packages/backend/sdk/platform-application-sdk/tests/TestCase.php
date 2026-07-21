<?php

declare(strict_types=1);

namespace Stackra\PlatformApplicationSdk\Tests;

use Orchestra\Testbench\TestCase as OrchestraTestCase;

/**
 * Shared base test case for the platform-application SDK.
 *
 * Extends Orchestra Testbench so the Laravel container is available
 * for tests that need to resolve `Spatie\LaravelData` pipeline
 * dependencies or Saloon fixtures. No package providers are wired
 * — the SDK ships no provider of its own; discovery lives inside
 * the umbrella `stackra/platform-sdk` package.
 *
 * @category PlatformApplicationSdk
 *
 * @since    0.1.0
 */
abstract class TestCase extends OrchestraTestCase
{
    /**
     * Register no package providers — the SDK is discovered by the
     * umbrella package's provider at runtime, and tests exercise
     * the individual classes directly.
     *
     * @param  \Illuminate\Foundation\Application  $app
     * @return array<int, class-string>
     */
    protected function getPackageProviders($app): array
    {
        return [];
    }
}
