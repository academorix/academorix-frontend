<?php

/**
 * @file services/identity/tests/TestCase.php
 *
 * @description
 * Base test case for Stackra Identity. Extends Laravel's
 * `Illuminate\Foundation\Testing\TestCase` and applies the
 * project's `CreatesApplication` trait to boot the app against
 * `bootstrap/app.php`. Tests that need Feature-scoped
 * database refresh compose `RefreshDatabase` via `Pest.php`
 * per `.kiro/steering/testing.md`.
 */

declare(strict_types=1);

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;
}
