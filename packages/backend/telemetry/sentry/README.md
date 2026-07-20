<div align="center">

<img src="https://github.com/academorix-inc/laravel--laravel/telemetry/sentry/-/raw/main/.gitlab/banner.svg" alt="Sentry" width="100%">

</div>

Sentry error tracking and monitoring with automatic context discovery for
Academorix applications.

## 📑 Table of Contents

- [Overview](#-overview)
- [Installation](#-installation)
- [Features](#-features)
- [Attributes](#-attributes)
  - [AsSentryContext](#assentrycontext)
- [Examples](#-examples)

## 🌟 Overview

The Telemetry Sentry package simplifies error tracking by providing automatic
discovery of Sentry context. You can define how Sentry reports should be
enriched with user data, tags, and extra context using PHP 8 attributes.

## 📦 Installation

This package is included with the main `academorix/laravel-telemetry` package.
To install separately:

```bash
composer require academorix/laravel-telemetry-sentry
```

## ✨ Features

- **Automatic Context Discovery**: Enrich Sentry reports automatically via
  `#[AsSentryContext]`.
- **Scope Customization**: Full control over Sentry Scope within
  attribute-decorated classes.
- **Environment Aware**: Configurable enabled state for different environments.

## 🎯 Attributes

### `AsSentryContext`

Marks a class as a Sentry context provider. The class must be invokable and
receive a `Sentry\State\Scope` instance.

**Properties:**

- `enabled`: (default: `true`) Whether the context provider is active.
- `priority`: (default: `100`) Application priority.

## 💡 Examples

Check the [.examples](.examples) directory for real-world usage patterns.

### Custom Context Provider

```php
use Academorix\Sentry\Attributes\AsSentryContext;
use Sentry\State\Scope;

#[AsSentryContext]
class AppContext
{
    public function __invoke(Scope $scope): void
    {
        $scope->setTag('app_version', config('app.version'));
    }
}
```
