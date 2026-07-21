<?php

/**
 * @file packages/exceptions/tests/Unit/TranslatesMessagesTest.php
 *
 * @description
 * Unit coverage for {@see \Stackra\Exceptions\Concerns\TranslatesMessages},
 * the trait every {@see \Stackra\Exceptions\Exception}
 * subclass mixes in via the base class.
 *
 * ## What the trait promises
 *
 * A four-tier lookup that resolves to a localised user-facing string
 * (or `null`, signalling "renderer picks a generic fallback"):
 *
 *   1. Instance-level `withTranslationKey('...')` override.
 *   2. Class-level `TRANSLATION_KEY` constant.
 *   3. `null` when neither is set.
 *
 * Around this: a merge-preserving `withTranslationParameters()` for
 * placeholder values, a `withTranslationLocale()` for per-throw
 * locale overrides, and a `resolveTranslatedMessage()` that walks
 * the translator when one is available.
 *
 * ## Why the tests use a bare fixture
 *
 * The trait lives on the abstract base — we exercise it through a
 * concrete subclass declared just for these tests so no shipping
 * class's TRANSLATION_KEY couples to the assertions.
 *
 * ## The two "no translator" paths
 *
 *   - `function_exists('trans')` returns false — no translator is
 *     loaded (tinker, some queue workers, static analysers).
 *   - `trans()` returns the input key unchanged — no translation for
 *     that key is registered.
 *
 * Both must resolve to `null` from `resolveTranslatedMessage()` so
 * the base class can fall through to its literal / null default.
 * The tests below use Testbench for the translator paths and
 * inspect via reflection for the "no translator" paths.
 */

declare(strict_types=1);

use Stackra\Exceptions\Exception;
use Illuminate\Contracts\Translation\Translator;
use Orchestra\Testbench\TestCase;

uses(TestCase::class);

/**
 * Test-only subclass — small, opinionated defaults so assertions
 * don't need to know about any shipping subclass. Declared once at
 * file scope (guarded so re-inclusion is safe).
 */
if (! class_exists('TranslatesMessagesFixture', false)) {
    class TranslatesMessagesFixture extends Exception
    {
        public const CODE = 'test.translates_messages_fixture';

        public const TRANSLATION_KEY = 'exceptions::test.fixture_default';
    }
}

// -----------------------------------------------------------------
// translationKey() — override precedence
// -----------------------------------------------------------------

it('translationKey returns the class-level TRANSLATION_KEY when no override is set', function (): void {
    // Tier 2 of the lookup chain.
    $e = TranslatesMessagesFixture::make();

    expect($e->translationKey())->toBe('exceptions::test.fixture_default');
});

it('translationKey returns the per-instance override when set', function (): void {
    // Tier 1 wins over tier 2.
    $e = TranslatesMessagesFixture::make()
        ->withTranslationKey('exceptions::test.override_key');

    expect($e->translationKey())->toBe('exceptions::test.override_key');
});

it('translationKey falls back to class constant after withTranslationKey(null)', function (): void {
    // Clearing the override should restore the class constant, not
    // leave the getter returning null. This is the "reset" path.
    $e = TranslatesMessagesFixture::make()
        ->withTranslationKey('exceptions::test.override_key')
        ->withTranslationKey(null);

    expect($e->translationKey())->toBe('exceptions::test.fixture_default');
});

it('translationKey returns null when the class constant is empty and no override is set', function (): void {
    // Anonymous subclass with an empty TRANSLATION_KEY — mimics a
    // rare case where a caller extends Exception without
    // declaring one.
    $anon = new class extends Exception
    {
        public const CODE = 'test.no_key';

        public const TRANSLATION_KEY = '';
    };

    expect($anon->translationKey())->toBeNull();
});

// -----------------------------------------------------------------
// translationParameters() — merge semantics
// -----------------------------------------------------------------

it('withTranslationParameters merges without wiping earlier keys', function (): void {
    // The trait uses `array_replace` — later calls layer on top of
    // earlier ones without dropping keys the caller already set.
    $e = TranslatesMessagesFixture::make()
        ->withTranslationParameters(['a' => 1, 'b' => 2])
        ->withTranslationParameters(['b' => 20, 'c' => 3]);

    expect($e->translationParameters())->toEqual(['a' => 1, 'b' => 20, 'c' => 3]);
});

it('translationParameters starts empty', function (): void {
    expect(TranslatesMessagesFixture::make()->translationParameters())->toEqual([]);
});

// -----------------------------------------------------------------
// translationLocale() — per-throw locale override
// -----------------------------------------------------------------

it('translationLocale is null by default (uses app locale)', function (): void {
    // Null means "use the app's active locale" — the default path.
    expect(TranslatesMessagesFixture::make()->translationLocale())->toBeNull();
});

it('withTranslationLocale sets and clears the per-throw locale', function (): void {
    // A named factory might set a specific locale when the throw
    // site knows the user's preferred language better than the
    // active app locale (e.g. a webhook handler).
    $e = TranslatesMessagesFixture::make()->withTranslationLocale('fr');

    expect($e->translationLocale())->toBe('fr');

    $e->withTranslationLocale(null);

    expect($e->translationLocale())->toBeNull();
});

// -----------------------------------------------------------------
// resolveTranslatedMessage() — translator resolution paths
// -----------------------------------------------------------------

it('userMessage returns null when the translator returns the key unchanged (no matching translation)', function (): void {
    // Laravel's translator returns the input key verbatim when no
    // translation is loaded. The trait treats this as "no
    // translation" and returns null so the renderer falls through
    // to a generic title.
    $e = TranslatesMessagesFixture::make()
        ->withTranslationKey('exceptions::test.definitely_missing_key');

    expect($e->userMessage())->toBeNull();
});

it('userMessage returns the translated string when a translation exists for the key', function (): void {
    // Swap the container-bound translator for a stub that always
    // returns a fixed string. We're not testing Laravel's translator
    // — just the trait's handling of a successful lookup.
    $this->app->instance('translator', new class implements Translator
    {
        public function get($key, array $replace = [], $locale = null): string
        {
            // Return a fixed string; parameter interpolation is
            // Laravel's job, not the trait's.
            return "translated:{$key}";
        }

        public function choice($key, $number, array $replace = [], $locale = null): string
        {
            return $this->get($key, $replace, $locale);
        }

        public function getLocale(): string
        {
            return 'en';
        }

        public function setLocale($locale): void
        {
            // no-op
        }
    });

    $e = TranslatesMessagesFixture::make()
        ->withTranslationKey('exceptions::test.exists');

    expect($e->userMessage())->toBe('translated:exceptions::test.exists');
});

it('userMessage returns null when translationKey is null (no class default, no override)', function (): void {
    // The `null` key path — the trait short-circuits before
    // touching the translator.
    $anon = new class extends Exception
    {
        public const CODE = 'test.no_key';

        public const TRANSLATION_KEY = '';
    };

    expect($anon->userMessage())->toBeNull();
});

// -----------------------------------------------------------------
// Locale override actually flows to the translator
// -----------------------------------------------------------------

it('withTranslationLocale forwards the locale to the translator', function (): void {
    // Prove the trait passes the locale through to `trans()` — we
    // capture the argument in the stub and assert on it.
    $capturedLocale = null;

    $this->app->instance('translator', new class($capturedLocale) implements Translator
    {
        public function __construct(private ?string &$captured)
        {
        }

        public function get($key, array $replace = [], $locale = null): string
        {
            $this->captured = $locale;

            // Return something other than the key so the trait
            // treats the lookup as successful.
            return 'ok';
        }

        public function choice($key, $number, array $replace = [], $locale = null): string
        {
            return $this->get($key, $replace, $locale);
        }

        public function getLocale(): string
        {
            return 'en';
        }

        public function setLocale($locale): void
        {
        }
    });

    TranslatesMessagesFixture::make()
        ->withTranslationKey('exceptions::test.locale_probe')
        ->withTranslationLocale('fr')
        ->userMessage();

    expect($capturedLocale)->toBe('fr');
});
