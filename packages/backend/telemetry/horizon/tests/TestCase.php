<?php

declare(strict_types=1);

namespace Stackra\Horizon\Tests;

use Illuminate\Foundation\Application;
use Orchestra\Testbench\TestCase as BaseTestCase;
use Stackra\Horizon\Providers\HorizonServiceProvider;

/**
 * Base Test Case for Horizon Tests.
 *
 * Provides common setup and utilities for testing Horizon functionality.
 */
abstract class TestCase extends BaseTestCase
{
    /**
     * Setup the test environment.
     */
    protected function setUp(): void
    {
        parent::setUp();

        // Additional setup if needed
    }

    /**
     * Get package providers.
     *
     * @param  Application              $app
     * @return array<int, class-string>
     */
    protected function getPackageProviders($app): array
    {
        return [
            HorizonServiceProvider::class,
        ];
    }

    /**
     * Define environment setup.
     *
     * @param Application $app
     */
    protected function getEnvironmentSetUp($app): void
    {
        // Setup default database to use sqlite :memory:
        $app['config']->set('database.default', 'testing');
        $app['config']->set('database.connections.testing', [
            'driver' => 'sqlite',
            'database' => ':memory:',
            'prefix' => '',
        ]);

        // Setup Horizon configuration
        $app['config']->set('horizon.use', 'default');
        $app['config']->set('horizon.prefix', 'horizon-test:');
    }
}
