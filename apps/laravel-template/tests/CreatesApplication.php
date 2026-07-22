<?php

/**
 * @file apps/laravel-template/tests/CreatesApplication.php
 *
 * @description
 * Test-application factory. Boots the same `bootstrap/app.php`
 * every request uses so tests share the exact provider +
 * middleware graph as production.
 */

declare(strict_types=1);

namespace Tests;

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Application;

trait CreatesApplication
{
    /**
     * Create the application instance for tests.
     */
    public function createApplication(): Application
    {
        /** @var Application $app */
        $app = require __DIR__ . '/../bootstrap/app.php';

        $app->make(Kernel::class)->bootstrap();

        return $app;
    }
}
