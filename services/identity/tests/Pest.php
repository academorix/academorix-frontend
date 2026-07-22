<?php

/**
 * @file services/identity/tests/Pest.php
 *
 * @description
 * Pest global test config for Stackra Identity. Applies the
 * `Tests\TestCase` base to every Feature test + wires the
 * `RefreshDatabase` trait (per `.kiro/steering/testing.md`).
 */

declare(strict_types=1);

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

pest()->extend(TestCase::class)->in('Unit');
