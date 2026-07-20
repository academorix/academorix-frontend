<?php

/**
 * @file packages/scheduling/tests/Pest.php
 *
 * @description
 * Pest configuration for the scheduling package.
 *
 * Individual test files that need a booted Laravel container
 * (service-provider wiring, `Schedule` resolution) opt into
 * Testbench explicitly via
 * `uses(\Orchestra\Testbench\TestCase::class);` at the top of
 * the file. Pure-unit tests (Frequency enum, discovery, registrar
 * with a hand-rolled Schedule stub) run without a container.
 *
 * There is deliberately no global `->in('Feature')` binding — a
 * Feature suite will be added when integration surfaces exist.
 */

declare(strict_types=1);
