<?php

/**
 * @file apps/stackra/src/sdks/platform-application-sdk/tests/Pest.php
 *
 * @description
 * Pest bootstrap for the platform-application SDK. Extends Orchestra
 * Testbench for both suites — Data / Payload tests still benefit
 * from a container being available (Spatie Data's data pipeline
 * resolves several helpers out of it), and Resource tests need
 * a container-driven MockClient.
 */

declare(strict_types=1);

use Academorix\PlatformApplicationSdk\Tests\TestCase;

uses(TestCase::class)->in(__DIR__);
