<?php

declare(strict_types=1);

/**
 * @file packages/framework/caching/tests/Pest.php
 *
 * Pest bootstrap for the caching package.
 * Extends Orchestra Testbench so container + config are wired the
 * same way they would be inside a consuming Laravel app.
 */

use Orchestra\Testbench\TestCase;

uses(TestCase::class)->in(__DIR__);
