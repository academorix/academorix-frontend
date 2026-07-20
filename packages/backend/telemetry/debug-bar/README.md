<div align="center">

<img src="https://github.com/academorix-inc/laravel--laravel/telemetry/debugbar/-/raw/main/.gitlab/banner.svg" alt="Debugbar" width="100%">

</div>

Laravel Debugbar integration with automatic collector discovery for Academorix
applications.

## 📑 Table of Contents

- [Overview](#-overview)
- [Installation](#-installation)
- [Features](#-features)
- [Configuration](#-configuration)
- [Attributes](#-attributes)
  - [AsCollector](#ascollector)
- [Examples](#-examples)

## 🌟 Overview

The Telemetry Debugbar package provides a seamless way to extend the Laravel
Debugbar with custom collectors. It leverages PHP 8 attributes for automatic
discovery, eliminating the need to manually register collectors in your Service
Providers.

## 📦 Installation

This package is included with the main `academorix/laravel-telemetry` package.
If you need to install it separately:

```bash
composer require academorix/laravel-telemetry-debugbar
```

## ✨ Features

- **Automatic Discovery**: Simply tag your collector class with `#[AsCollector]`
  and it will be registered automatically.
- **Fluent Registry**: Manage collectors dynamically via the built-in registry.
- **Standard Integration**: Works perfectly with `barryvdh/laravel-debugbar`.

## ⚙️ Configuration

The package works out of the box. If you need to customize behavior, you can
publish the configuration:

```bash
php artisan vendor:publish --tag=telemetry-debugbar-config
```

## 🎯 Attributes

### `AsCollector`

Marks a class as a Debugbar collector.

**Properties:**

- `name`: (optional) The name of the collector as it appears in the Debugbar.
- `enabled`: (default: `true`) Whether the collector should be registered.
- `priority`: (default: `100`) The order in which collectors are registered.

## 💡 Examples

Check the [.examples](.examples) directory for real-world usage patterns.

### Basic Collector

```php
use Academorix\Debugbar\Attributes\AsCollector;
use DebugBar\DataCollector\DataCollector;

#[AsCollector(name: 'custom_metrics')]
class MyCollector extends DataCollector
{
    public function collect(): array
    {
        return ['metric' => 'value'];
    }

    public function getName(): string
    {
        return 'custom_metrics';
    }
}
```
