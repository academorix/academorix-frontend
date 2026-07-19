<?php

declare(strict_types=1);

namespace Academorix\Observability\Monitoring\Tests;

use Orchestra\Testbench\TestCase as OrchestraTestCase;

/**
 * Base test case for academorix-observability/monitoring.
 *
 * @category Monitoring
 *
 * @since    0.1.0
 */
abstract class TestCase extends OrchestraTestCase
{
    // Add package providers here if the module's tests need Laravel container
    // access beyond Orchestra's defaults.
}
