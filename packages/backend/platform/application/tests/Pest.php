<?php

/**
 * @file modules/platform/application/tests/Pest.php
 *
 * @description
 * Pest v4 bootstrap. Wires Feature tests into the package `TestCase`
 * (Orchestra Testbench with the Application service provider loaded)
 * and applies `RefreshDatabase` so every test starts from a clean
 * schema. Unit tests skip Laravel entirely — pure logic exercised
 * without a boot cycle.
 */

declare(strict_types=1);

use Stackra\Application\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(TestCase::class, RefreshDatabase::class)->in('Feature');
