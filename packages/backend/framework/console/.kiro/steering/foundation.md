---
inclusion: auto
---

# Foundation Package (`academorix/laravel-foundation`)

**Namespace:** `Academorix\Console\` **Location:** `modules/ab/foundation/`
**Composer:** `academorix/laravel-foundation` **PHP:** ^8.4|^8.5

## Purpose

Custom Application class, base API structure, core providers, comprehensive
exception hierarchy, AI-powered error solutions, and 30+ utility enums for
headless API backends.

## Dependencies

| Package                          | Version | Purpose                    |
| -------------------------------- | ------- | -------------------------- |
| `illuminate/routing`             | ^13.0   | Routing                    |
| `illuminate/support`             | ^13.0   | Laravel utilities          |
| `jaybizzle/crawler-detect`       | ^1.3    | Bot detection              |
| `maantje/react-email`            | ^1.0    | Email templates            |
| `openai-php/laravel`             | ^0.19   | AI error solutions         |
| `pixielity/laravel-discovery`    | ^1.0    | Attribute discovery        |
| `pixielity/stub-generator`       | ^1.0    | Code generation            |
| `spatie/backtrace`               | ^1.6    | Stack trace analysis       |
| `spatie/laravel-error-solutions` | ^1.1    | Error solution suggestions |
| `academorix/laravel-framework`   | @dev    | Core framework             |

## Key Components

### Custom Application Class

`Academorix\Console\Application` — extends Laravel's Application with:

- Custom directory structure support
- Configurable project path
- Priority-based service provider registration

`ApplicationBuilder` — fluent builder for application configuration.

### Enums (30+)

Comprehensive utility enums used across the entire ecosystem:

| Enum               | Purpose                               |
| ------------------ | ------------------------------------- |
| `Environment`      | dev, staging, production, testing     |
| `HttpStatusCode`   | All HTTP status codes                 |
| `HttpMethod`       | GET, POST, PUT, PATCH, DELETE, etc.   |
| `DatabaseDriver`   | mysql, pgsql, sqlite, sqlsrv          |
| `CacheDriver`      | redis, memcached, file, database      |
| `QueueDriver`      | redis, sqs, database, sync            |
| `MailDriver`       | smtp, ses, mailgun, postmark          |
| `LogDriver`        | stack, single, daily, syslog          |
| `SessionDriver`    | file, cookie, database, redis         |
| `FilesystemDriver` | local, s3, gcs                        |
| `ContentType`      | JSON, XML, HTML, etc.                 |
| `Direction`        | ltr, rtl                              |
| `SortOrder`        | asc, desc                             |
| `Locale`           | en, ar, fr, etc.                      |
| `Theme`            | light, dark, system                   |
| `Status`           | active, inactive, pending             |
| `UserStatus`       | active, suspended, deactivated        |
| `UserType`         | admin, user, guest                    |
| `DeviceType`       | desktop, mobile, tablet               |
| `Duration`         | seconds, minutes, hours, days         |
| `CronExpression`   | Common cron patterns                  |
| `GoogleFont`       | Popular Google Fonts                  |
| `Color`            | Named colors                          |
| `FileExtension`    | Common file extensions                |
| `DataType`         | string, integer, boolean, array, etc. |
| `CastType`         | Laravel cast types                    |
| `PolicyAbility`    | viewAny, view, create, update, delete |

### Exception Hierarchy (20+)

Comprehensive exception classes for different HTTP status codes:

- `NotFoundException` (404)
- `UnauthorizedException` (401)
- `ForbiddenException` (403)
- `ValidationException` (422)
- `ConflictException` (409)
- `TooManyRequestsException` (429)
- `ServiceUnavailableException` (503)
- And more...

### AI-Powered Error Solutions

`AiSolution`, `AiSolutionProvider` — uses OpenAI to suggest fixes for runtime
errors in development.

### Middleware

Request, Response, and Security middleware for API applications.

### Localization

i18n files for Arabic (`ar`) and English (`en`).

### Base Classes

- `BaseEmail` — base class for all emails
- `BaseEvent` — base class for all events

## Notes

- This package is the application bootstrap layer
- All other packages depend on it indirectly via the framework
- Enums follow the standard pattern: `use Enum` trait, `#[Label]`,
  `#[Description]` on every case
