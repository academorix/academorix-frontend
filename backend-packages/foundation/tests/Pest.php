<?php

/**
 * @file packages/foundation/tests/Pest.php
 *
 * @description
 * Pest configuration for the foundation package.
 *
 * Test files that need a booted Laravel container opt into Testbench
 * explicitly via `uses(\Orchestra\Testbench\TestCase::class);` at the
 * top of the file. Pure-unit tests (Assert, CorrelationId, enums)
 * run without one.
 *
 * There is deliberately no global `->in('Feature')` binding — a
 * Feature suite will be added when integration surfaces exist.
 */

declare(strict_types=1);
