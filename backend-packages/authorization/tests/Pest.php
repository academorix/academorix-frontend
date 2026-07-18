<?php

/**
 * @file packages/authorization/tests/Pest.php
 *
 * @description
 * Pest bootstrap for the `academorix/authorization` test suite.
 * Kept minimal — Feature tests boot Testbench per case, Unit tests
 * run without a framework instance.
 *
 * When the suite grows past a dozen cases, split into:
 *   - `tests/Unit/`     — pure-PHP unit tests, no framework boot.
 *   - `tests/Feature/`  — Testbench-hosted feature tests.
 */

declare(strict_types=1);

// No global hooks yet — placeholder so composer's autoload map
// has somewhere to point.
