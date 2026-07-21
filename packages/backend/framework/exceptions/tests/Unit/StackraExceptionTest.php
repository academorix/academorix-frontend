<?php

/**
 * @file packages/exceptions/tests/Unit/StackraExceptionTest.php
 *
 * @description
 * Unit coverage for {@see \Stackra\Exceptions\StackraException},
 * the root of the whole exception hierarchy.
 *
 * ## Surface under test
 *
 *   - Static `::make()` factory — return-type preservation, previous
 *     chaining, default-message fallback, subclass typing.
 *   - Fluent setters — `withContext`, `withContextValue`,
 *     `withUserMessage`, `withTranslationKey`,
 *     `withTranslationParameters`, `withSeverity`, `withCategory`,
 *     `withHttpStatus`, `withRetryAfter`, `withCorrelationId`.
 *   - Metadata accessors — `errorCode()`, `severity()`, `category()`,
 *     `httpStatus()`, `retryAfter()`, `correlationId()`, `context()`,
 *     `translationKey()`.
 *   - Correlation-id snapshotting semantics (constructor snapshot vs.
 *     fallback to the current static value).
 *   - `toArray()` / `jsonSerialize()` envelope shape — the exact key
 *     set reporters + the JSON formatter consume.
 *   - `userMessage()` fallback path when Laravel's translator is not
 *     booted — literal + `:placeholder` interpolation only.
 *
 * ## Why the tests deliberately avoid Testbench
 *
 * The container is NOT booted here. The whole point of the fallback
 * path in `userMessage()` is to work outside of a booted app (queue
 * workers, tinker, static analysers). Booting Testbench would hide
 * regressions in that path — a bare-metal PHP runtime is exactly the
 * failure mode we want to protect.
 *
 * ## Test fixture
 *
 * We define a small subclass `StackraExceptionTestFixture` so
 * assertions don't couple to any shipping subclass's defaults. The
 * fixture picks a `TRANSLATION_KEY` on the split-layout
 * (`exceptions::test.fixture`) so translation-key assertions stay
 * meaningful for the newer namespace convention.
 */

declare(strict_types=1);

use Stackra\Exceptions\StackraException;
use Stackra\Exceptions\Auth\ForbiddenException;
use Stackra\Exceptions\Enums\ErrorCategory;
use Stackra\Exceptions\Enums\ErrorSeverity;
use Stackra\Foundation\Support\CorrelationId;

afterEach(function (): void {
    // Correlation id is a request-scoped static — leaking it across
    // tests would cause spooky-action-at-a-distance failures.
    CorrelationId::forget();
});

/**
 * Minimal concrete subclass used to exercise the abstract base.
 * Declared once — the `class_exists` guard makes the test file
 * safe to re-include if Pest's runner ever picks it up twice.
 */
if (! class_exists('StackraExceptionTestFixture', false)) {
    class StackraExceptionTestFixture extends StackraException
    {
        public const CODE = 'test.fixture';

        // Split-layout key — matches the `exceptions::<file>.<key>`
        // convention every shipping subclass now follows.
        public const TRANSLATION_KEY = 'exceptions::test.fixture';
    }
}

// -----------------------------------------------------------------
// ::make() and static return typing
// -----------------------------------------------------------------

it('::make preserves the concrete subclass type', function (): void {
    // Real subclass — proves that `static` in the base signature
    // propagates the concrete class through the factory.
    $e = ForbiddenException::make('boom');

    expect($e)->toBeInstanceOf(ForbiddenException::class)
        ->and($e)->toBeInstanceOf(StackraException::class);
});

it('::make on a bare subclass uses the class default message when passed empty', function (): void {
    $e = StackraExceptionTestFixture::make();

    // When the caller supplies an empty string, `defaultMessage()`
    // returns the CODE constant — an at-least-searchable literal.
    expect($e->getMessage())->toBe('test.fixture')
        ->and($e->errorCode())->toBe('test.fixture');
});

it('::make forwards the developer message unchanged when provided', function (): void {
    $e = StackraExceptionTestFixture::make('specific dev message');

    expect($e->getMessage())->toBe('specific dev message');
});

it('::make attaches a previous throwable', function (): void {
    // `$previous` chaining is critical for reporters — Sentry needs
    // the original stack, not just the wrapper.
    $cause = new RuntimeException('root cause');
    $e = StackraExceptionTestFixture::make('wrapper', $cause);

    expect($e->getPrevious())->toBe($cause);
});

// -----------------------------------------------------------------
// Fluent setters — mutation semantics
// -----------------------------------------------------------------

it('withContext merges keys without wiping earlier ones', function (): void {
    // Merge semantics are load-bearing: named factories often set a
    // baseline context that later callers augment.
    $e = StackraExceptionTestFixture::make()
        ->withContext(['a' => 1, 'b' => 2])
        ->withContext(['b' => 20, 'c' => 3]);

    expect($e->context())->toEqual(['a' => 1, 'b' => 20, 'c' => 3]);
});

it('withContextValue sets a single key', function (): void {
    $e = StackraExceptionTestFixture::make()
        ->withContextValue('user_id', 42)
        ->withContextValue('role', 'admin');

    expect($e->context())->toEqual(['user_id' => 42, 'role' => 'admin']);
});

it('withUserMessage sets the literal fallback string', function (): void {
    $e = StackraExceptionTestFixture::make()
        ->withUserMessage('Nope, try again.');

    // Without a translator booted, the literal wins — that's the
    // "step 1" of the four-step lookup documented on the base class.
    expect($e->userMessage())->toBe('Nope, try again.');
});

it('withUserMessage(null) clears the literal fallback', function (): void {
    $e = StackraExceptionTestFixture::make()
        ->withUserMessage('something')
        ->withUserMessage(null);

    expect($e->userMessage())->toBeNull();
});

it('withTranslationKey overrides the class-level TRANSLATION_KEY per instance', function (): void {
    $e = StackraExceptionTestFixture::make()
        ->withTranslationKey('exceptions::custom.key');

    expect($e->translationKey())->toBe('exceptions::custom.key');
});

it('withTranslationKey does not leak to sibling instances', function (): void {
    // Instance-level override must not corrupt the class constant.
    StackraExceptionTestFixture::make()
        ->withTranslationKey('exceptions::overridden');

    $fresh = StackraExceptionTestFixture::make();

    expect($fresh->translationKey())->toBe('exceptions::test.fixture');
});

it('withTranslationParameters merges without wiping earlier ones', function (): void {
    // Same merge semantics as `withContext` — critical for named
    // factories that seed base parameters before the caller adds more.
    $e = StackraExceptionTestFixture::make()
        ->withTranslationParameters(['role' => 'admin', 'plan' => 'pro'])
        ->withTranslationParameters(['plan' => 'enterprise', 'seats' => 5]);

    expect($e->translationParameters())->toEqual([
        'role' => 'admin',
        'plan' => 'enterprise',
        'seats' => 5,
    ]);
});

it('withSeverity changes severity', function (): void {
    $e = StackraExceptionTestFixture::make()->withSeverity(ErrorSeverity::Critical);

    expect($e->severity())->toBe(ErrorSeverity::Critical);
});

it('withCategory changes category', function (): void {
    $e = StackraExceptionTestFixture::make()->withCategory(ErrorCategory::Security);

    expect($e->category())->toBe(ErrorCategory::Security);
});

it('withHttpStatus overrides the HTTP status', function (): void {
    $e = StackraExceptionTestFixture::make()->withHttpStatus(418);

    expect($e->httpStatus())->toBe(418);
});

it('withRetryAfter sets and clears the retry-after hint', function (): void {
    $e = StackraExceptionTestFixture::make()->withRetryAfter(60);

    expect($e->retryAfter())->toBe(60);

    // Passing null must clear the hint — the JSON formatter treats
    // null as "no Retry-After header".
    $e->withRetryAfter(null);

    expect($e->retryAfter())->toBeNull();
});

// -----------------------------------------------------------------
// Correlation id snapshotting
// -----------------------------------------------------------------

it('snapshots the correlation id at construction time', function (): void {
    // The whole point of snapshotting: queued jobs / retries carry
    // the correlation id even after the request-scoped static has
    // been reset.
    CorrelationId::set('req_construct');

    $e = StackraExceptionTestFixture::make();

    CorrelationId::forget();

    expect($e->correlationId())->toBe('req_construct');
});

it('falls back to the current static id when construction happened outside a request', function (): void {
    // When no id was set at construction, `correlationId()` looks
    // up the static on demand — supports test setups that seed the
    // id after throw.
    $e = StackraExceptionTestFixture::make();

    CorrelationId::set('req_later');

    expect($e->correlationId())->toBe('req_later');
});

it('withCorrelationId overrides the snapshot', function (): void {
    CorrelationId::set('req_original');
    $e = StackraExceptionTestFixture::make()->withCorrelationId('req_override');

    expect($e->correlationId())->toBe('req_override');
});

it('withCorrelationId(null) resets to reading from the static current', function (): void {
    CorrelationId::set('req_original');
    $e = StackraExceptionTestFixture::make();

    $e->withCorrelationId(null);
    CorrelationId::forget();

    // After clearing both, we're truly ID-less.
    expect($e->correlationId())->toBeNull();
});

// -----------------------------------------------------------------
// toArray / jsonSerialize — envelope contract
// -----------------------------------------------------------------

it('toArray exposes every documented key', function (): void {
    // This test locks in the exact key set reporters index against.
    // A field rename or removal is a breaking change; the assertion
    // uses `toEqual` (not `toMatchArray`) to catch extra keys too.
    CorrelationId::set('req_json');

    $e = StackraExceptionTestFixture::make('dev message')
        ->withUserMessage('user-facing')
        ->withContext(['a' => 1])
        ->withTranslationParameters(['x' => 'y'])
        ->withRetryAfter(15);

    expect($e->toArray())->toEqual([
        'code' => 'test.fixture',
        'message' => 'dev message',
        'userMessage' => 'user-facing',
        'status' => 500,
        'severity' => 'error',
        'category' => 'unexpected',
        'context' => ['a' => 1],
        'translationKey' => 'exceptions::test.fixture',
        // Post-rename: the shape ships `translationParameters`, NOT
        // `translationReplacements`. Locked in here so a future
        // regression breaks the test loudly.
        'translationParameters' => ['x' => 'y'],
        'correlationId' => 'req_json',
        'retryAfter' => 15,
    ]);
});

it('jsonSerialize mirrors toArray', function (): void {
    $e = StackraExceptionTestFixture::make('dev')->withRetryAfter(1);

    // These two views must never diverge — `jsonSerialize` is what
    // reporters see when they `json_encode` the throwable.
    expect($e->jsonSerialize())->toEqual($e->toArray());
});

// -----------------------------------------------------------------
// userMessage() fallback path (no container, no translator)
// -----------------------------------------------------------------

it('userMessage returns the literal fallback when no translator is available', function (): void {
    $e = StackraExceptionTestFixture::make()
        ->withUserMessage('Fallback literal only.');

    expect($e->userMessage())->toBe('Fallback literal only.');
});

it('userMessage returns null when neither translation nor literal are set', function (): void {
    $e = StackraExceptionTestFixture::make();

    // Null is the fourth-tier fallback — the JSON formatter picks
    // it up and substitutes a generic title.
    expect($e->userMessage())->toBeNull();
});

it('userMessage interpolates :placeholder tokens into the literal fallback', function (): void {
    // The literal path uses `strtr` on `:placeholder` tokens so the
    // behaviour is identical whether translations are loaded or not.
    $e = StackraExceptionTestFixture::make()
        ->withUserMessage('You need the :role role to :ability.')
        ->withTranslationParameters(['role' => 'admin', 'ability' => 'delete']);

    expect($e->userMessage())->toBe('You need the admin role to delete.');
});

it('userMessage interpolation coerces stringable and null replacements', function (): void {
    // A common pain point: passing an int / DTO / null into
    // `withTranslationParameters`. The interpolator MUST coerce
    // (and treat null as empty) rather than throwing.
    $stringable = new class implements Stringable
    {
        public function __toString(): string
        {
            return 'stringable-value';
        }
    };

    $e = StackraExceptionTestFixture::make()
        ->withUserMessage('a=:a b=:b c=:c')
        ->withTranslationParameters([
            'a' => $stringable,
            'b' => 42,
            'c' => null,
        ]);

    expect($e->userMessage())->toBe('a=stringable-value b=42 c=');
});

// -----------------------------------------------------------------
// Metadata accessors
// -----------------------------------------------------------------

it('errorCode returns the class CODE constant', function (): void {
    expect(StackraExceptionTestFixture::make()->errorCode())->toBe('test.fixture');
});

it('translationKey defaults to the class TRANSLATION_KEY constant', function (): void {
    // The fixture uses split-layout — matches the convention every
    // shipping exception now follows.
    expect(StackraExceptionTestFixture::make()->translationKey())
        ->toBe('exceptions::test.fixture');
});

it('translationKey on a real subclass returns its split-layout constant', function (): void {
    // ForbiddenException is the canonical example — its TRANSLATION_KEY
    // points at `exceptions::auth.forbidden`, the split-file layout
    // where `auth` is the file name and `forbidden` is the key inside.
    expect(ForbiddenException::make()->translationKey())
        ->toBe('exceptions::auth.forbidden');
});
