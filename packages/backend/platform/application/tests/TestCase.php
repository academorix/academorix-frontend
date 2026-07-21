<?php

declare(strict_types=1);

namespace Stackra\Application\Tests;

use Stackra\Application\Providers\ApplicationServiceProvider;
use Orchestra\Testbench\TestCase as OrchestraTestCase;

/**
 * Base Feature-test case for `stackra/application`.
 *
 * Orchestra Testbench loads the module's service provider + every
 * framework provider the module depends on (authorization, caching,
 * console, crud, database, events, exceptions, foundation, localization,
 * retention, routing, scheduling, service-provider).
 *
 * @category Application
 *
 * @since    0.1.0
 */
abstract class TestCase extends OrchestraTestCase
{
    /**
     * Providers registered in every Feature test's boot cycle.
     *
     * @param  \Illuminate\Foundation\Application  $app
     * @return array<int, class-string>
     */
    protected function getPackageProviders($app): array
    {
        return [
            ApplicationServiceProvider::class,
        ];
    }

    /**
     * Environment overrides applied before every test.
     *
     * @param  \Illuminate\Foundation\Application  $app
     */
    protected function defineEnvironment($app): void
    {
        $app['config']->set('database.default', 'testing');
        $app['config']->set('database.connections.testing', [
            'driver'   => 'sqlite',
            'database' => ':memory:',
            'prefix'   => '',
        ]);
    }
}
