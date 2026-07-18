<?php

/**
 * @file packages/exceptions/tests/Unit/HttpExceptionsTest.php
 *
 * @description
 * Unit coverage for every HTTP-boundary exception + its named
 * factories:
 *
 *   - {@see \Academorix\Exceptions\Http\ValidationException}
 *   - {@see \Academorix\Exceptions\Http\ConflictException}
 *   - {@see \Academorix\Exceptions\Http\EntityNotFoundException}
 *   - {@see \Academorix\Exceptions\Http\TooManyRequestsException}
 *   - {@see \Academorix\Exceptions\Http\PaymentRequiredException}
 *   - {@see \Academorix\Exceptions\Http\MethodNotAllowedException}
 *   - {@see \Academorix\Exceptions\Http\UnsupportedMediaTypeException}
 *   - {@see \Academorix\Exceptions\Http\PayloadTooLargeException}
 *
 * ## What these tests protect
 *
 * The JSON error envelope's wire shape — every client (mobile,
 * SPA, third-party integration) reads:
 *
 *   - `errorCode`         — the literal clients branch on.
 *   - `httpStatus`        — echoed as the HTTP status line.
 *   - `severity` / `category` — used by dashboards and alerting.
 *   - `translationKey`    — resolves to the localised user message.
 *   - `context`           — structured metadata for logs.
 *   - `translationParameters` — placeholders for `:name` in the
 *     localised message.
 *
 * Every named factory is exercised on its documented input path so
 * a silent regression (e.g. dropping `retryAfter` from `exceeded()`)
 * fails a specific test.
 *
 * ## Translation keys use the split layout
 *
 * Post-refactor: keys are `exceptions::http.<key>` /
 * `exceptions::billing.<key>` — the file name is the middle segment
 * (`http`, `billing`, `auth`, `domain`, `infrastructure`), the key
 * is the last segment.
 */

declare(strict_types=1);

use Academorix\Exceptions\Enums\ErrorCategory;
use Academorix\Exceptions\Enums\ErrorSeverity;
use Academorix\Exceptions\Http\ConflictException;
use Academorix\Exceptions\Http\EntityNotFoundException;
use Academorix\Exceptions\Http\MethodNotAllowedException;
use Academorix\Exceptions\Http\PayloadTooLargeException;
use Academorix\Exceptions\Http\PaymentRequiredException;
use Academorix\Exceptions\Http\TooManyRequestsException;
use Academorix\Exceptions\Http\UnsupportedMediaTypeException;
use Academorix\Exceptions\Http\ValidationException;
use Academorix\Foundation\Support\CorrelationId;

afterEach(function (): void {
    CorrelationId::forget();
});

// -----------------------------------------------------------------
// ValidationException::withErrors
// -----------------------------------------------------------------

it('ValidationException carries Validation + Info + 422 metadata', function (): void {
    $e = ValidationException::make();

    // 422 with `Info` severity because validation is expected
    // traffic — every form on the app produces some.
    expect($e->errorCode())->toBe('http.validation')
        ->and($e->httpStatus())->toBe(422)
        ->and($e->severity())->toBe(ErrorSeverity::Info)
        ->and($e->category())->toBe(ErrorCategory::Validation)
        // Split-layout key.
        ->and($e->translationKey())->toBe('exceptions::http.validation');
});

it('ValidationException::withErrors normalises single-string values into arrays', function (): void {
    // Domain services frequently pass a single string per field.
    // The renderer expects `list<string>` per field so the
    // exception normalises at the boundary.
    $e = ValidationException::withErrors([
        'email' => 'This email is already registered.',
        'password' => ['Too short.', 'Needs a digit.'],
    ]);

    expect($e)->toBeInstanceOf(ValidationException::class)
        ->and($e->fields())->toEqual([
            'email' => ['This email is already registered.'],
            'password' => ['Too short.', 'Needs a digit.'],
        ])
        // Fields are mirrored into context so reporters can find
        // them without a `ValidationException`-specific accessor.
        ->and($e->context())->toMatchArray([
            'fields' => [
                'email' => ['This email is already registered.'],
                'password' => ['Too short.', 'Needs a digit.'],
            ],
        ]);
});

it('ValidationException::withErrors uses the message argument as the developer message', function (): void {
    $e = ValidationException::withErrors(['x' => 'bad'], 'Custom validation failure.');

    expect($e->getMessage())->toBe('Custom validation failure.');
});

it('ValidationException::addField appends to an existing field', function (): void {
    // Multi-step domain actions accumulate errors — the mutator
    // supports that pattern without forcing the caller to rebuild
    // the whole map.
    $e = ValidationException::withErrors(['email' => 'Required.']);
    $e->addField('email', 'Also must be unique.');
    $e->addField('password', 'Missing.');

    expect($e->fields())->toEqual([
        'email' => ['Required.', 'Also must be unique.'],
        'password' => ['Missing.'],
    ])
        // The context mirror must stay in sync — this is what the
        // renderer looks at.
        ->and($e->context()['fields'])->toEqual($e->fields());
});

// -----------------------------------------------------------------
// ConflictException — three named factories
// -----------------------------------------------------------------

it('ConflictException carries Conflict + Info + 409 metadata', function (): void {
    $e = ConflictException::make();

    expect($e->errorCode())->toBe('http.conflict')
        ->and($e->httpStatus())->toBe(409)
        ->and($e->severity())->toBe(ErrorSeverity::Info)
        ->and($e->category())->toBe(ErrorCategory::Conflict)
        ->and($e->translationKey())->toBe('exceptions::http.conflict');
});

it('ConflictException::duplicate populates resource + key context', function (): void {
    $e = ConflictException::duplicate('email', 'me@corp.com');

    expect($e)->toBeInstanceOf(ConflictException::class)
        ->and($e->translationKey())->toBe('exceptions::http.conflict_duplicate')
        ->and($e->context())->toMatchArray([
            'resource' => 'email',
            'key' => 'me@corp.com',
        ])
        ->and($e->translationParameters())->toMatchArray([
            'resource' => 'email',
            'key' => 'me@corp.com',
        ]);
});

it('ConflictException::optimisticLock populates expected + actual versions', function (): void {
    $e = ConflictException::optimisticLock('invoice', 3, 5);

    expect($e->translationKey())->toBe('exceptions::http.conflict_optimistic_lock')
        ->and($e->context())->toMatchArray([
            'resource' => 'invoice',
            'expected_version' => 3,
            'actual_version' => 5,
        ])
        // Only the resource ships into the user message — version
        // numbers are internal.
        ->and($e->translationParameters())->toMatchArray(['resource' => 'invoice']);
});

it('ConflictException::optimisticLock accepts string versions (ETags)', function (): void {
    // ETag-shaped versions (`W/"v1"`) go through the same path as
    // integer versions — the union type on the factory tolerates
    // both.
    $e = ConflictException::optimisticLock('doc', 'v1', 'v2');

    expect($e->context())->toMatchArray([
        'expected_version' => 'v1',
        'actual_version' => 'v2',
    ]);
});

it('ConflictException::invalidTransition populates from + to context', function (): void {
    $e = ConflictException::invalidTransition('draft', 'archived');

    // State names ARE part of the public API for state-machine
    // resources so they surface in translation parameters (fine
    // to show in the user message).
    expect($e->translationKey())->toBe('exceptions::http.conflict_invalid_transition')
        ->and($e->context())->toMatchArray(['from' => 'draft', 'to' => 'archived'])
        ->and($e->translationParameters())->toMatchArray(['from' => 'draft', 'to' => 'archived']);
});

// -----------------------------------------------------------------
// EntityNotFoundException::forModel
// -----------------------------------------------------------------

it('EntityNotFoundException carries the entity_not_found code + 404', function (): void {
    $e = EntityNotFoundException::make();

    // Distinct code from `http.not_found` — "entity missing" often
    // means the resource was deleted since load, distinct from
    // "URL doesn't exist" which is a client-side routing bug.
    expect($e->errorCode())->toBe('http.entity_not_found')
        ->and($e->httpStatus())->toBe(404)
        ->and($e->translationKey())->toBe('exceptions::http.entity_not_found');
});

it('EntityNotFoundException::forModel with an id records both model and id', function (): void {
    $e = EntityNotFoundException::forModel('App\\Models\\Invoice', 42);

    expect($e)->toBeInstanceOf(EntityNotFoundException::class)
        ->and($e->context())->toMatchArray([
            'model' => 'App\\Models\\Invoice',
            'id' => 42,
        ])
        // Developer message carries the id for grep-ability.
        ->and($e->getMessage())->toContain('42');
});

it('EntityNotFoundException::forModel without an id stores null and omits the suffix', function (): void {
    $e = EntityNotFoundException::forModel('App\\Models\\Invoice');

    expect($e->context())->toMatchArray([
        'model' => 'App\\Models\\Invoice',
        'id' => null,
    ])
        // When id is null, the "with id [X]" suffix on the dev
        // message is dropped.
        ->and($e->getMessage())->not->toContain('with id');
});

// -----------------------------------------------------------------
// TooManyRequestsException::exceeded
// -----------------------------------------------------------------

it('TooManyRequestsException carries RateLimit + Notice + 429 metadata', function (): void {
    $e = TooManyRequestsException::make();

    // Notice severity: one step above Info. 429s are expected but
    // a spike is worth surfacing on dashboards without paging.
    expect($e->errorCode())->toBe('http.too_many_requests')
        ->and($e->httpStatus())->toBe(429)
        ->and($e->severity())->toBe(ErrorSeverity::Notice)
        ->and($e->category())->toBe(ErrorCategory::RateLimit)
        ->and($e->translationKey())->toBe('exceptions::http.too_many_requests');
});

it('TooManyRequestsException::exceeded sets retryAfter + limiter context', function (): void {
    // Post-rename: the factory is `exceeded()` — deliberately
    // distinct from the parent's `withRetryAfter()` setter so the
    // callsite reads naturally.
    $e = TooManyRequestsException::exceeded(30, 'api');

    expect($e)->toBeInstanceOf(TooManyRequestsException::class)
        ->and($e->retryAfter())->toBe(30)
        ->and($e->context())->toMatchArray(['limiter' => 'api'])
        // Only `seconds` surfaces in the user message — limiter
        // name is internal.
        ->and($e->translationParameters())->toMatchArray(['seconds' => 30]);
});

it('TooManyRequestsException::exceeded tolerates a null limiter', function (): void {
    // When no limiter identifier is known (default rate limit), the
    // named factory still works — `limiter` in context is null.
    $e = TooManyRequestsException::exceeded(15);

    expect($e->retryAfter())->toBe(15)
        ->and($e->context())->toMatchArray(['limiter' => null]);
});

// -----------------------------------------------------------------
// PaymentRequiredException — three named factories
// -----------------------------------------------------------------

it('PaymentRequiredException carries Billing + Info + 402 metadata', function (): void {
    $e = PaymentRequiredException::make();

    expect($e->errorCode())->toBe('billing.payment_required')
        ->and($e->httpStatus())->toBe(402)
        ->and($e->severity())->toBe(ErrorSeverity::Info)
        ->and($e->category())->toBe(ErrorCategory::Billing);
});

it('PaymentRequiredException::seatLimitReached stores the seat limit', function (): void {
    $e = PaymentRequiredException::seatLimitReached(5);

    expect($e)->toBeInstanceOf(PaymentRequiredException::class)
        ->and($e->translationKey())->toBe('exceptions::billing.seat_limit')
        ->and($e->context())->toMatchArray(['seat_limit' => 5])
        ->and($e->translationParameters())->toMatchArray(['limit' => 5]);
});

it('PaymentRequiredException::planUpgradeRequired stores the required plan', function (): void {
    $e = PaymentRequiredException::planUpgradeRequired('enterprise');

    expect($e->translationKey())->toBe('exceptions::billing.plan_upgrade')
        ->and($e->context())->toMatchArray(['required_plan' => 'enterprise'])
        ->and($e->translationParameters())->toMatchArray(['plan' => 'enterprise']);
});

it('PaymentRequiredException::insufficientBalance stores required + current cents', function (): void {
    // Cents (not dollars) because floating-point money math is a
    // known footgun — the API is integer-cents everywhere.
    $e = PaymentRequiredException::insufficientBalance(2500, 800);

    expect($e->translationKey())->toBe('exceptions::billing.insufficient_balance')
        ->and($e->context())->toMatchArray([
            'required_cents' => 2500,
            'current_cents' => 800,
        ]);
});

// -----------------------------------------------------------------
// MethodNotAllowedException::with
// -----------------------------------------------------------------

it('MethodNotAllowedException carries NotFound + Info + 405 metadata', function (): void {
    $e = MethodNotAllowedException::make();

    // Category is NotFound (not Validation) — a 405 tells the client
    // "the URL exists but not for this verb", closer to routing
    // than to input validation.
    expect($e->errorCode())->toBe('http.method_not_allowed')
        ->and($e->httpStatus())->toBe(405)
        ->and($e->severity())->toBe(ErrorSeverity::Info)
        ->and($e->category())->toBe(ErrorCategory::NotFound)
        ->and($e->translationKey())->toBe('exceptions::http.method_not_allowed');
});

it('MethodNotAllowedException::with stores the allowed verb list', function (): void {
    $e = MethodNotAllowedException::with(['GET', 'HEAD']);

    // Verb list in context (structured) + interpolated in user
    // message (as a comma-joined string).
    expect($e)->toBeInstanceOf(MethodNotAllowedException::class)
        ->and($e->context())->toMatchArray(['allowed' => ['GET', 'HEAD']])
        ->and($e->translationParameters())->toMatchArray(['allowed' => 'GET, HEAD']);
});

// -----------------------------------------------------------------
// UnsupportedMediaTypeException::accepted
// -----------------------------------------------------------------

it('UnsupportedMediaTypeException carries Validation + Info + 415 metadata', function (): void {
    $e = UnsupportedMediaTypeException::make();

    expect($e->errorCode())->toBe('http.unsupported_media_type')
        ->and($e->httpStatus())->toBe(415)
        ->and($e->severity())->toBe(ErrorSeverity::Info)
        ->and($e->category())->toBe(ErrorCategory::Validation)
        ->and($e->translationKey())->toBe('exceptions::http.unsupported_media_type');
});

it('UnsupportedMediaTypeException::accepted stores accepted + received', function (): void {
    $e = UnsupportedMediaTypeException::accepted(
        accepted: ['application/json', 'multipart/form-data'],
        received: 'text/xml',
    );

    expect($e)->toBeInstanceOf(UnsupportedMediaTypeException::class)
        ->and($e->context())->toMatchArray([
            'accepted' => ['application/json', 'multipart/form-data'],
            'received' => 'text/xml',
        ])
        // In parameters, `accepted` is a comma-joined string so the
        // `:accepted` placeholder renders sensibly in the message.
        ->and($e->translationParameters())->toMatchArray([
            'accepted' => 'application/json, multipart/form-data',
            'received' => 'text/xml',
        ]);
});

it('UnsupportedMediaTypeException::accepted normalises null received to empty string', function (): void {
    // When the client sent no Content-Type at all, the factory
    // stores `null` in context (structured absence) but coerces to
    // empty string in translation parameters (so `:received`
    // doesn't render as literal ":received").
    $e = UnsupportedMediaTypeException::accepted(['application/json']);

    expect($e->context())->toMatchArray(['received' => null])
        ->and($e->translationParameters())->toMatchArray(['received' => '']);
});

// -----------------------------------------------------------------
// PayloadTooLargeException::withLimit
// -----------------------------------------------------------------

it('PayloadTooLargeException carries Validation + Info + 413 metadata', function (): void {
    $e = PayloadTooLargeException::make();

    expect($e->errorCode())->toBe('http.payload_too_large')
        ->and($e->httpStatus())->toBe(413)
        ->and($e->severity())->toBe(ErrorSeverity::Info)
        ->and($e->category())->toBe(ErrorCategory::Validation)
        ->and($e->translationKey())->toBe('exceptions::http.payload_too_large');
});

it('PayloadTooLargeException::withLimit stores limit + actual byte counts', function (): void {
    $e = PayloadTooLargeException::withLimit(1024, 4096);

    expect($e)->toBeInstanceOf(PayloadTooLargeException::class)
        ->and($e->context())->toMatchArray([
            'limit_bytes' => 1024,
            'actual_bytes' => 4096,
        ])
        ->and($e->translationParameters())->toMatchArray([
            'limit_bytes' => 1024,
            'actual_bytes' => 4096,
        ]);
});
