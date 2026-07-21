<?php

/**
 * @file packages/exceptions/src/Support/ExceptionMapper.php
 *
 * @description
 * Converts framework / Symfony / SPL throwables into the equivalent
 * {@see \Stackra\Exceptions\StackraException} so downstream
 * renderers, reporters, and dashboards only ever have to reason
 * about one hierarchy.
 *
 * ## Design
 *
 * The mapper is deterministic and pure — no container access, no
 * static state. Register additional mappings via {@see register()}
 * from a service provider, a test, or a domain package's own
 * bootstrap:
 *
 *     $mapper->register(RayIsBrokenException::class,
 *         fn (\Throwable $e) => IntegrationException::upstream('ray', 0, [], $e));
 *
 * ## Precedence
 *
 *   1. `StackraException` instances pass through unchanged.
 *   2. Explicit `class-string => factory` entries registered on the
 *      instance win in the order they were declared (custom wins
 *      over default because `register()` prepends).
 *   3. Anything implementing Symfony's `HttpExceptionInterface`
 *      falls into the status-code switch as a last resort.
 *   4. Everything else becomes an
 *      {@see \Stackra\Exceptions\UnexpectedException} wrapping
 *      the original throwable.
 *
 * ## Why `::make()` everywhere
 *
 * Every mapping now delegates to the target class's inherited
 * `::make()` factory (or a named factory that wraps `::make()`)
 * instead of calling `new *Exception(...)` directly. Rationale:
 *
 *   - Preserves subclass typing via `static` return.
 *   - Keeps mapping code readable — `ForbiddenException::make(...)`
 *     reads like a callsite in domain code.
 *   - Gives us one construction path per exception class, so
 *     translation-replacement + context wiring stays uniform.
 */

declare(strict_types=1);

namespace Stackra\Exceptions\Support;

use Stackra\Exceptions\StackraException;
use Stackra\Exceptions\Auth\AuthenticationException as StackraAuthenticationException;
use Stackra\Exceptions\Auth\ForbiddenException;
use Stackra\Exceptions\Http\ConflictException;
use Stackra\Exceptions\Http\EntityNotFoundException;
use Stackra\Exceptions\Http\MethodNotAllowedException;
use Stackra\Exceptions\Http\NotFoundException;
use Stackra\Exceptions\Http\TooManyRequestsException;
use Stackra\Exceptions\Http\UnsupportedMediaTypeException;
use Stackra\Exceptions\Http\ValidationException;
use Stackra\Exceptions\Infrastructure\MaintenanceModeException;
use Stackra\Exceptions\Infrastructure\ServiceUnavailableException;
use Stackra\Exceptions\UnexpectedException;
use Closure;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\RecordsNotFoundException;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Validation\ValidationException as LaravelValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\HttpKernel\Exception\UnsupportedMediaTypeHttpException;
use Throwable;

final class ExceptionMapper
{
    /** @var array<class-string<Throwable>, Closure(Throwable): StackraException> */
    private array $mappings = [];

    public function __construct()
    {
        $this->registerDefaults();
    }

    /**
     * Convert any throwable into the corresponding
     * {@see StackraException}. Deterministic — same input always
     * yields the same output class.
     */
    public function map(Throwable $e): StackraException
    {
        if ($e instanceof StackraException) {
            return $e;
        }

        foreach ($this->mappings as $class => $factory) {
            if ($e instanceof $class) {
                return $factory($e);
            }
        }

        // Symfony HttpException is the fallback for anything else
        // Laravel throws — we honour its status code and headers.
        if ($e instanceof HttpExceptionInterface) {
            return $this->fromHttpException($e);
        }

        return UnexpectedException::wrap($e);
    }

    /**
     * Register a custom throwable → Stackra factory. Prepended
     * to the mapping table so custom entries take precedence over
     * defaults.
     *
     * @param class-string<Throwable> $class
     * @param Closure(Throwable): StackraException $factory
     */
    public function register(string $class, Closure $factory): void
    {
        $this->mappings = [$class => $factory] + $this->mappings;
    }

    // ---------------------------------------------------------------
    // Internals — the default mapping table.
    // ---------------------------------------------------------------

    /**
     * Populate the default mapping table. Every factory here uses
     * `::make()` or a named factory so the resulting instance goes
     * through the same construction path as domain-thrown
     * exceptions.
     */
    private function registerDefaults(): void
    {
        $this->mappings = [
            // ---- Laravel-specific ----

            LaravelValidationException::class => static function (Throwable $e): StackraException {
                /** @var LaravelValidationException $e */
                return ValidationException::withErrors($e->errors(), $e->getMessage())
                    ->withHttpStatus($e->status);
            },

            AuthenticationException::class => static function (Throwable $e): StackraException {
                /** @var AuthenticationException $e */
                $guards = method_exists($e, 'guards') ? $e->guards() : [];

                return StackraAuthenticationException::make($e->getMessage() ?: 'Unauthenticated.')
                    ->withContextValue('guards', $guards);
            },

            AuthorizationException::class => static fn (Throwable $e): StackraException => ForbiddenException::make(
                $e->getMessage() !== '' ? $e->getMessage() : 'This action is unauthorized.'
            ),

            ModelNotFoundException::class => static function (Throwable $e): StackraException {
                /** @var ModelNotFoundException<\Illuminate\Database\Eloquent\Model> $e */
                $model = method_exists($e, 'getModel') ? $e->getModel() : null;
                $ids = method_exists($e, 'getIds') ? $e->getIds() : [];

                $id = $ids === []
                    ? null
                    : (is_array($ids) ? implode(',', array_map('strval', $ids)) : (string) $ids);

                return EntityNotFoundException::forModel(
                    is_string($model) ? $model : 'Model',
                    $id,
                );
            },

            RecordsNotFoundException::class => static fn (Throwable $e): StackraException => NotFoundException::make(
                $e->getMessage() !== '' ? $e->getMessage() : 'No records found.'
            ),

            ThrottleRequestsException::class => static function (Throwable $e): StackraException {
                /** @var ThrottleRequestsException $e */
                $retryAfter = (int) ($e->getHeaders()['Retry-After'] ?? 0);

                return TooManyRequestsException::exceeded($retryAfter);
            },

            // ---- Symfony HTTP layer ----

            NotFoundHttpException::class => static fn (Throwable $e): StackraException => NotFoundException::make(
                $e->getMessage() !== '' ? $e->getMessage() : 'Not found.'
            ),

            MethodNotAllowedHttpException::class => static function (Throwable $e): StackraException {
                /** @var MethodNotAllowedHttpException $e */
                $allow = (string) ($e->getHeaders()['Allow'] ?? '');
                $allowed = $allow === '' ? [] : array_values(array_map('trim', explode(',', $allow)));

                return MethodNotAllowedException::with($allowed);
            },

            UnauthorizedHttpException::class => static fn (Throwable $e): StackraException => StackraAuthenticationException::make(
                $e->getMessage() !== '' ? $e->getMessage() : 'Unauthorized.'
            ),

            AccessDeniedHttpException::class => static fn (Throwable $e): StackraException => ForbiddenException::make(
                $e->getMessage() !== '' ? $e->getMessage() : 'Forbidden.'
            ),

            ConflictHttpException::class => static fn (Throwable $e): StackraException => ConflictException::make(
                $e->getMessage() !== '' ? $e->getMessage() : 'Conflict.'
            ),

            UnsupportedMediaTypeHttpException::class => static fn (Throwable $e): StackraException => UnsupportedMediaTypeException::accepted([]),

            TooManyRequestsHttpException::class => static function (Throwable $e): StackraException {
                /** @var TooManyRequestsHttpException $e */
                $retryAfter = (int) ($e->getHeaders()['Retry-After'] ?? 0);

                return TooManyRequestsException::exceeded($retryAfter);
            },

            ServiceUnavailableHttpException::class => static function (Throwable $e): StackraException {
                /** @var ServiceUnavailableHttpException $e */
                $retryAfter = (int) ($e->getHeaders()['Retry-After'] ?? 0);

                // Laravel's `php artisan down` surfaces as
                // Symfony\ServiceUnavailableHttpException; branch on
                // the app-level flag so maintenance mode gets its
                // own dashboard bucket.
                if (function_exists('app') && app()->isDownForMaintenance()) {
                    return MaintenanceModeException::scheduled($retryAfter > 0 ? $retryAfter : null);
                }

                return ServiceUnavailableException::dependency('unknown')
                    ->withRetryAfter($retryAfter > 0 ? $retryAfter : null);
            },
        ];
    }

    /**
     * Fallback for any `HttpExceptionInterface` we haven't mapped
     * by class. Uses the status code to pick the closest
     * Stackra equivalent.
     */
    private function fromHttpException(HttpExceptionInterface $e): StackraException
    {
        $status = $e->getStatusCode();
        $message = $e->getMessage() !== '' ? $e->getMessage() : "HTTP {$status}";

        return match (true) {
            $status === 401 => StackraAuthenticationException::make($message),
            $status === 403 => ForbiddenException::make($message),
            $status === 404 => NotFoundException::make($message),
            $status === 405 => MethodNotAllowedException::with([]),
            $status === 409 => ConflictException::make($message),
            $status === 415 => UnsupportedMediaTypeException::accepted([]),
            $status === 422 => ValidationException::withErrors([], $message),
            $status === 429 => TooManyRequestsException::exceeded(
                (int) ($e->getHeaders()['Retry-After'] ?? 0)
            ),
            $status === 503 => ServiceUnavailableException::dependency('unknown'),
            default => UnexpectedException::wrap($e)->withHttpStatus($status),
        };
    }
}
