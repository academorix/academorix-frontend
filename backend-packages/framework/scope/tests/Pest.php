<?php

/**
 * @file tests/Pest.php
 *
 * @description
 * Pest bootstrap for the scope package. Follows the same shape as
 * `packages/framework/caching/tests/Pest.php` — Orchestra Testbench
 * boots a minimal Laravel container so the package's service
 * provider, container bindings, and Eloquent models all resolve
 * exactly like they would inside a consuming app.
 *
 * Individual test files that don't need a booted container can
 * override with `uses()->in(...)` at the top of the file to
 * keep pure-unit tests fast.
 */

declare(strict_types=1);

use Orchestra\Testbench\TestCase;

uses(TestCase::class)->in(__DIR__);
