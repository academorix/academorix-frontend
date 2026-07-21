<?php

declare(strict_types=1);

namespace Stackra\Nightwatch\Tests;

use Orchestra\Testbench\TestCase as BaseTestCase;
use Stackra\Nightwatch\Providers\NightwatchServiceProvider;

abstract class TestCase extends BaseTestCase
{
    protected function getPackageProviders($app): array
    {
        return [
            NightwatchServiceProvider::class,
        ];
    }
}
