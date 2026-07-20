<?php

declare(strict_types=1);

/**
 * @file packages/sdk/api-sdk/tests/Pest.php
 *
 * Pest bootstrap for the SDK. Extends Orchestra Testbench so
 * container + config are wired the same way they would be in a
 * consuming Laravel app.
 */

use Orchestra\Testbench\TestCase;

uses(TestCase::class)->in(__DIR__);
