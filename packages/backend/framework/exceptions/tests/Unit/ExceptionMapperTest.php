<?php

/**
 * @file packages/exceptions/tests/Unit/ExceptionMapperTest.php
 *
 * @description
 * Unit coverage for {@see \Stackra\Exceptions\Support\ExceptionMapper}.
 * The mapper is deterministic and pure — no container is booted for
 * these tests.
 */

declare(strict_types=1);

use Stackra\Exceptions\Auth\AuthenticationException as StackraAuthException;
use Stackra\Exceptions\Auth\ForbiddenException;
use Stackra\Exceptions\Http\ConflictException;
use Stackra\Exceptions\Http\EntityNotFoundException;
use Stackra\Exceptions\Http\NotFoundException;
use Stackra\Exceptions\Http\TooManyRequestsException;
use Stackra\Exceptions\Http\ValidationException as StackraValidationException;
use Stackra\Exceptions\Support\ExceptionMapper;
use Stackra\Exceptions\UnexpectedException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

// -----------------------------------------------------------------
// Pass-through / fallback
// -----------------------------------------------------------------

it('passes Exception through unchanged', function (): void {
    $mapper = new ExceptionMapper;
    $original = ForbiddenException::missingRole('admin');

    expect($mapper->map($original))->toBe($original);
});

it('wraps unknown throwables in UnexpectedException', function (): void {
    $mapper = new ExceptionMapper;

    $result = $mapper->map(new RuntimeException('boom'));

    expect($result)->toBeInstanceOf(UnexpectedException::class);
});

// -----------------------------------------------------------------
// Symfony HTTP layer
// -----------------------------------------------------------------

it('maps Symfony NotFoundHttpException to NotFoundException', function (): void {
    $mapper = new ExceptionMapper;

    $result = $mapper->map(new NotFoundHttpException('not there'));

    expect($result)->toBeInstanceOf(NotFoundException::class)
        ->and($result->httpStatus())->toBe(404);
});

it('maps Symfony AccessDeniedHttpException to ForbiddenException', function (): void {
    $mapper = new ExceptionMapper;

    $result = $mapper->map(new AccessDeniedHttpException('nope'));

    expect($result)->toBeInstanceOf(ForbiddenException::class);
});

it('maps Symfony ConflictHttpException to ConflictException', function (): void {
    $mapper = new ExceptionMapper;

    $result = $mapper->map(new ConflictHttpException('taken'));

    expect($result)->toBeInstanceOf(ConflictException::class);
});

it('maps Symfony TooManyRequestsHttpException with retry-after', function (): void {
    $mapper = new ExceptionMapper;

    $result = $mapper->map(new TooManyRequestsHttpException(45));

    expect($result)->toBeInstanceOf(TooManyRequestsException::class)
        ->and($result->retryAfter())->toBe(45);
});

// -----------------------------------------------------------------
// Laravel-specific
// -----------------------------------------------------------------

it('maps Laravel AuthenticationException with guard context', function (): void {
    $mapper = new ExceptionMapper;

    $result = $mapper->map(new AuthenticationException('unauth', ['web', 'sanctum']));

    expect($result)->toBeInstanceOf(StackraAuthException::class)
        ->and($result->context())->toMatchArray(['guards' => ['web', 'sanctum']]);
});

it('maps ModelNotFoundException to EntityNotFoundException', function (): void {
    $mapper = new ExceptionMapper;

    $mnf = new ModelNotFoundException;
    $mnf->setModel(App\Fake\Model::class, [42]);

    $result = $mapper->map($mnf);

    expect($result)->toBeInstanceOf(EntityNotFoundException::class)
        ->and($result->context())->toMatchArray([
            'model' => 'App\\Fake\\Model',
            'id' => '42',
        ]);
});

// -----------------------------------------------------------------
// Status-code fallback
// -----------------------------------------------------------------

it('maps a bare HttpException(415) via the status-code fallback', function (): void {
    $mapper = new ExceptionMapper;

    $result = $mapper->map(new HttpException(415, 'bad type'));

    expect($result->httpStatus())->toBe(415);
});

it('maps an unmapped HttpException status via UnexpectedException, preserving the status', function (): void {
    $mapper = new ExceptionMapper;

    $result = $mapper->map(new HttpException(418, "I'm a teapot"));

    expect($result)->toBeInstanceOf(UnexpectedException::class)
        ->and($result->httpStatus())->toBe(418);
});

// -----------------------------------------------------------------
// Custom mappings
// -----------------------------------------------------------------

it('allows callers to register custom mappings that win over defaults', function (): void {
    $mapper = new ExceptionMapper;
    $mapper->register(
        LogicException::class,
        static fn (Throwable $e): StackraValidationException => StackraValidationException::withErrors(['foo' => 'bar']),
    );

    $result = $mapper->map(new LogicException('x'));

    expect($result)->toBeInstanceOf(StackraValidationException::class);
});
