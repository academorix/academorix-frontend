<?php

declare(strict_types=1);

/**
 * @file packages/backend/telemetry/sentry/src/Services/SentryService.php
 *
 * @description
 * Request-scoped wrapper around the Sentry SDK. Reports errors,
 * configures scope with user + request context, records
 * breadcrumbs.
 *
 * ## Why request-scoped
 *
 * Under Octane the framework container stays alive across
 * requests. A service that captures `Auth::user()`, `request()`,
 * or `app()->environment()` MUST be `#[Scoped]` so the container
 * disposes of it between requests. This class was previously a
 * static-singleton that stashed the constructed object into a
 * `private static ?self $instance` — request-1's authenticated
 * user leaked into request-2's `configureScope()` call. Fixed
 * on 2026-07-21 (Phase B R1 of the compliance sweep): the static
 * locator is gone; every method is now an instance method;
 * dependencies arrive through container attribute injection.
 *
 * ## Usage
 *
 * Inject via the container — never via a static call:
 *
 *     public function __construct(
 *         private readonly SentryService $sentry,
 *     ) {}
 *
 *     $this->sentry->captureException($e);
 *     $this->sentry->configureScope();
 *
 * Under Octane the injected instance IS per-request (thanks to
 * `#[Scoped]` on this class), so the request/user snapshot the
 * scope carries is always fresh.
 *
 * @category Services
 *
 * @since    1.0.0
 */

namespace Stackra\Sentry\Services;

use Illuminate\Contracts\Auth\Guard;
use Illuminate\Contracts\Container\Container;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Container\Attributes\Auth as AuthAttr;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Http\Request;
use Stackra\Attributes\Attributes\Parameters\Config;
use Stackra\Foundation\Enums\ContainerToken;
use Stackra\Support\Arr;

use function Sentry\addBreadcrumb;

use Sentry\Breadcrumb;

use function Sentry\captureException;
use function Sentry\captureMessage;
use function Sentry\configureScope;

use Sentry\Severity;
use Sentry\State\Scope;
use Throwable;

/**
 * Instance service for Sentry integration.
 *
 * Consumers inject the class; every method is an instance method.
 * Under Octane the `#[Scoped]` binding guarantees one fresh
 * instance per request — no cross-request state.
 */
#[Scoped]
final class SentryService
{
    /**
     * @param  string|null   $sentryDsn  Sentry DSN from `config/sentry.php`; null means Sentry is off.
     * @param  Application   $app        The Laravel application (for `bound()` + `environment()` + `version()`).
     * @param  Guard         $auth       The default auth guard.
     * @param  Container     $container  Container reference so calls can be reached from static bridge helpers if ever needed.
     * @param  Request|null  $request    The current request. Nullable when the service is resolved outside a request (queue worker, console command).
     */
    public function __construct(
        #[Config('sentry.dsn')]
        protected readonly ?string $sentryDsn = null,
        protected readonly ?Application $app = null,
        #[AuthAttr]
        protected readonly ?Guard $auth = null,
        protected readonly ?Container $container = null,
        protected readonly ?Request $request = null,
    ) {}

    /**
     * Check whether Sentry is enabled + configured.
     *
     * Returns `true` only when both a DSN is present AND the SDK's
     * hub is bound in the container. `false` (fail-soft) whenever
     * anything is off — every other method short-circuits when
     * this is false.
     */
    public function isEnabled(): bool
    {
        return $this->sentryDsn !== null
            && $this->app !== null
            && $this->app->bound(ContainerToken::SENTRY->value);
    }

    /**
     * Configure Sentry scope with request + user context.
     *
     * Idempotent within a request — calling twice adds the tags
     * twice. Called by `captureException()` before every capture,
     * plus manually by the `SentryContext` middleware once per
     * request.
     */
    public function configureScope(): void
    {
        if (! $this->isEnabled()) {
            return;
        }

        configureScope(function (Scope $scope): void {
            // User context — only when a caller is authenticated.
            // `Guard::check()` short-circuits when the guard has
            // no user, so this is cheap on public endpoints.
            if ($this->auth !== null && $this->auth->check()) {
                $user = $this->auth->user();
                if ($user !== null) {
                    $scope->setUser([
                        'id' => $user->getAuthIdentifier(),
                        'email' => $user->email ?? null,
                        'username' => $user->name ?? null,
                    ]);
                }
            }

            // Environment tags come from the application.
            if ($this->app !== null) {
                $scope->setTag('environment', (string) $this->app->environment());
                $scope->setTag('laravel_version', (string) $this->app->version());
            }
            $scope->setTag('php_version', PHP_VERSION);

            // Request context — only when we're inside a request.
            // Queue workers + console commands construct this class
            // with `$request = null`; those paths still tag env +
            // php + laravel_version but skip request-only fields.
            if ($this->request !== null) {
                $scope->setTag('request_method', $this->request->method());
                $scope->setTag('request_path', $this->request->path());

                $scope->setContext('request', [
                    'url' => $this->request->fullUrl(),
                    'method' => $this->request->method(),
                    'ip' => $this->request->ip(),
                    'user_agent' => $this->request->userAgent(),
                    'request_id' => $this->request->header('X-Request-ID'),
                ]);
            }
        });
    }

    /**
     * Add a breadcrumb.
     *
     * Breadcrumbs are a trail of events leading up to an error.
     *
     * @param  string                $message   Breadcrumb message.
     * @param  array<string, mixed>  $data      Structured data attached to the crumb.
     * @param  string                $category  Category label (e.g. `navigation`, `http`, `user_action`).
     * @param  string                $level     Severity level (`debug`, `info`, `warning`, `error`, `fatal`).
     */
    public function addBreadcrumb(
        string $message,
        array $data = [],
        string $category = 'default',
        string $level = 'info',
    ): void {
        if (! $this->isEnabled()) {
            return;
        }

        $breadcrumbLevel = match ($level) {
            'debug' => Breadcrumb::LEVEL_DEBUG,
            'info' => Breadcrumb::LEVEL_INFO,
            'warning' => Breadcrumb::LEVEL_WARNING,
            'error' => Breadcrumb::LEVEL_ERROR,
            'fatal' => Breadcrumb::LEVEL_FATAL,
            default => Breadcrumb::LEVEL_INFO,
        };

        $breadcrumb = new Breadcrumb(
            level: $breadcrumbLevel,
            type: Breadcrumb::TYPE_DEFAULT,
            category: $category,
            message: $message,
            metadata: $data,
        );

        addBreadcrumb($breadcrumb);
    }

    /**
     * Capture a message.
     *
     * Use for important events that are not exceptions.
     *
     * @param  string  $message  The message.
     * @param  string  $level    Severity (`debug`, `info`, `warning`, `error`, `fatal`).
     */
    public function captureMessage(string $message, string $level = 'info'): void
    {
        if (! $this->isEnabled()) {
            return;
        }

        $severity = match ($level) {
            'debug' => Severity::debug(),
            'info' => Severity::info(),
            'warning' => Severity::warning(),
            'error' => Severity::error(),
            'fatal' => Severity::fatal(),
            default => Severity::info(),
        };

        captureMessage($message, $severity);
    }

    /**
     * Capture an exception.
     *
     * Configures the scope first so every capture carries the
     * current request + user context.
     *
     * @param  Throwable  $throwable  The exception to capture.
     */
    public function captureException(Throwable $throwable): void
    {
        if (! $this->isEnabled()) {
            return;
        }

        $this->configureScope();
        captureException($throwable);
    }

    /**
     * Set a custom tag in the Sentry scope.
     *
     * Tags are searchable key-value labels.
     *
     * @param  string  $key    Tag key.
     * @param  string  $value  Tag value.
     */
    public function setTag(string $key, string $value): void
    {
        if (! $this->isEnabled()) {
            return;
        }

        configureScope(function (Scope $scope) use ($key, $value): void {
            $scope->setTag($key, $value);
        });
    }

    /**
     * Set structured context data.
     *
     * @param  string                $key   Context key.
     * @param  array<string, mixed>  $data  Context payload.
     */
    public function setContext(string $key, array $data): void
    {
        if (! $this->isEnabled()) {
            return;
        }

        configureScope(function (Scope $scope) use ($key, $data): void {
            $scope->setContext($key, $data);
        });
    }

    /**
     * Set user context.
     *
     * @param  int|string            $id        User ID.
     * @param  string|null           $email     User email.
     * @param  string|null           $username  User username.
     * @param  array<string, mixed>  $extra     Additional user fields.
     */
    public function setUser(
        int|string $id,
        ?string $email = null,
        ?string $username = null,
        array $extra = [],
    ): void {
        if (! $this->isEnabled()) {
            return;
        }

        configureScope(function (Scope $scope) use ($id, $email, $username, $extra): void {
            $scope->setUser(Arr::merge([
                'id' => $id,
                'email' => $email,
                'username' => $username,
            ], $extra));
        });
    }
}
