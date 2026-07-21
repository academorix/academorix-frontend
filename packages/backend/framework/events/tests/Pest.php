<?php

/**
 * @file packages/events/tests/Pest.php
 *
 * @description
 * Pest configuration for the events package.
 *
 * Individual test files that need a booted Laravel container (the
 * service provider's discovery walk, the broadcaster wiring) opt
 * into Testbench explicitly via `uses(\Orchestra\Testbench\TestCase::class);`
 * at the top of the file. Pure-unit tests over the attribute
 * constructors and the {@see \Stackra\Events\Support\EventDiscovery}
 * scanner run without a container.
 *
 * There is deliberately no global `->in('Feature')` binding — a
 * Feature suite will be added when integration surfaces exist.
 */

declare(strict_types=1);
