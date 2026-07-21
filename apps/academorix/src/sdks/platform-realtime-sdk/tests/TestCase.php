<?php

declare(strict_types=1);

namespace Stackra\PlatformRealtimeSdk\Tests;

use Orchestra\Testbench\TestCase as OrchestraTestCase;

/**
 * Base test case for stackra-platform/realtime-sdk.
 *
 * @category RealtimeSdk
 *
 * @since    0.1.0
 */
abstract class TestCase extends OrchestraTestCase
{
    // Add package providers here if the SDK's tests need Laravel container
    // access beyond Orchestra's defaults.
}
