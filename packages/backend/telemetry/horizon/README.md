<div align="center">

<img src="https://github.com/academorix-inc/laravel--laravel/telemetry/horizon/-/raw/main/.gitlab/banner.svg" alt="Horizon" width="100%">

</div>

Laravel Horizon queue monitoring with automatic supervisor and metric discovery
for Academorix applications.

## 📑 Table of Contents

- [Overview](#-overview)
- [Installation](#-installation)
- [Features](#-features)
- [Attributes](#-attributes)
  - [AsMetric](#asmetric)
  - [HorizonTag](#horizontag)
- [Examples](#-examples)

## 🌟 Overview

The Telemetry Horizon package enhances Laravel Horizon with automatic discovery
of metrics and tagging logic. It simplifies queue monitoring by allowing you to
define metrics and tags directly on your classes using PHP 8 attributes.

## 📦 Installation

This package is included with the main `academorix/telemetry` package. To
install separately:

```bash
composer require academorix/telemetry-horizon
```

## ✨ Features

- **Automatic Metric Discovery**: Register custom Horizon metrics via
  `#[AsMetric]`.
- **Dynamic Tagging**: Apply Horizon tags automatically using `#[HorizonTag]`.
- **Monorepo Support**: Scans your entire project for Horizon-related
  attributes.

## 🎯 Attributes

### `AsMetric`

Marks a class as a Horizon metric for auto-discovery.

**Properties:**

- `name`: Unique identifier for the metric.
- `enabled`: (default: `true`) Whether the metric is active.
- `priority`: (default: `100`) Registration priority.

### `HorizonTag`

Defines tags to be applied to Horizon jobs.

**Properties:**

- `tags`: Array of string tags.
- `enabled`: (default: `true`) Whether the tagging logic is active.

## 💡 Examples

Check the [.examples](.examples) directory for real-world usage patterns.

### Custom Metric

```php
use Academorix\Horizon\Attributes\AsMetric;

#[AsMetric(name: 'sms_throughput')]
class SmsMetrics
{
    public function getValue()
    {
        return 100; // Calculated value
    }
}
```
