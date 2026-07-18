<?php

declare(strict_types=1);

namespace Academorix\Nightwatch\Tests;

use Orchestra\Testbench\TestCase as BaseTestCase;
use Academorix\Nightwatch\Providers\NightwatchServiceProvider;

abstract class TestCase extends BaseTestCase
{
    protected function getPackageProviders($app): array
    {
        return [
            NightwatchServiceProvider::class,
        ];
    }
}
