# Horizon Tests

Test suite for the Academorix Telemetry Horizon package.

## Running Tests

```bash
composer test
```

## Test Structure

- `Unit/` - Unit tests for individual components
- `Feature/` - Feature tests for integrated functionality
- `Integration/` - Integration tests with Laravel Horizon

## Writing Tests

All tests should extend the `TestCase` class which provides:

- Horizon service provider registration
- Test database configuration
- Common test utilities

Example:

```php
namespace Academorix\Horizon\Tests\Unit;

use Academorixlemetry\Horizon\Tests\TestCase;

class MetricTest extends TestCase
{
    public function test_metric_can_be_registered(): void
    {
        // Test implementation
    }
}
```
