<?php

/**
 * @file packages/exceptions/tests/Pest.php
 *
 * @description
 * Pest configuration for the exceptions package.
 *
 * Individual test files that need a booted Laravel container (renderer,
 * middleware, service-provider wiring) opt into Testbench explicitly
 * via `uses(\Orchestra\Testbench\TestCase::class);` at the top of the
 * file. Pure-unit tests (Redactor, TraceCleaner, DTOs) run without a
 * container.
 *
 * There is deliberately no global `->in('Feature')` binding — a
 * Feature suite will be added when integration surfaces exist. Until
 * then keeping the binding here would either point at a missing
 * directory (warning) or force us to keep an empty `.gitkeep`.
 */

declare(strict_types=1);
