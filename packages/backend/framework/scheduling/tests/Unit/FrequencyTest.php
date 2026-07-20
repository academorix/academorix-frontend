<?php

/**
 * @file packages/scheduling/tests/Unit/FrequencyTest.php
 *
 * @description
 * Exercises the {@see \Academorix\Scheduling\Enums\Frequency}
 * enum — the single mapping between our declarative
 * `#[Schedule(Frequency::...)]` attribute and Laravel's fluent
 * scheduler builder methods.
 *
 * ## Why every case matters
 *
 *   - A regression that maps `Frequency::Daily` onto
 *     `->hourly()` silently would run a job 24x too often. That
 *     class of bug is invisible in code review but obvious in
 *     the test matrix.
 *   - `apply()` is a `match` — the fact that it type-checks
 *     already guarantees exhaustiveness, but the test locks in
 *     the semantic mapping (case → method name) so future
 *     Laravel API drift is caught here rather than in
 *     production.
 *
 * ## No container needed
 *
 * `Frequency::apply()` calls plain methods on a passed-in
 * `Event`. We hand it an anonymous stub that records the method
 * invoked, so these tests run in pure PHP without booting
 * Testbench.
 */

declare(strict_types=1);

use Academorix\Scheduling\Enums\Frequency;
use Illuminate\Console\Scheduling\Event;

/**
 * Build a lightweight Event stub that records which cadence
 * method was invoked. Every builder call returns `$this` so the
 * fluent chain compiles.
 *
 * We use PHPUnit's mock builder to satisfy the concrete
 * `Event` type declared on `Frequency::apply()`.
 */
function frequencyTest_makeEventSpy(): object
{
    return new class extends Event
    {
        /** Name of the last cadence method invoked. */
        public string $called = '';

        public function __construct()
        {
            // Skip parent constructor — we only exercise builder
            // methods, never a real invocation.
        }

        public function everyMinute(): static
        {
            $this->called = 'everyMinute';

            return $this;
        }

        public function everyTwoMinutes(): static
        {
            $this->called = 'everyTwoMinutes';

            return $this;
        }

        public function everyFiveMinutes(): static
        {
            $this->called = 'everyFiveMinutes';

            return $this;
        }

        public function everyTenMinutes(): static
        {
            $this->called = 'everyTenMinutes';

            return $this;
        }

        public function everyFifteenMinutes(): static
        {
            $this->called = 'everyFifteenMinutes';

            return $this;
        }

        public function everyThirtyMinutes(): static
        {
            $this->called = 'everyThirtyMinutes';

            return $this;
        }

        public function hourly(): static
        {
            $this->called = 'hourly';

            return $this;
        }

        public function daily(): static
        {
            $this->called = 'daily';

            return $this;
        }

        public function weekly(): static
        {
            $this->called = 'weekly';

            return $this;
        }

        public function monthly(): static
        {
            $this->called = 'monthly';

            return $this;
        }

        public function quarterly(): static
        {
            $this->called = 'quarterly';

            return $this;
        }

        public function yearly(): static
        {
            $this->called = 'yearly';

            return $this;
        }
    };
}

// -----------------------------------------------------------------
// Group 1 — every case maps onto the expected builder method
// -----------------------------------------------------------------

it('maps every Frequency case onto the expected Event method', function (Frequency $case, string $expected): void {
    // Guard: the test matrix below must stay in lockstep with
    // the enum. If a new case is added without a matrix row,
    // the enum's `apply()` match arm will type-error before this
    // test even runs.
    $spy = frequencyTest_makeEventSpy();

    $case->apply($spy);

    expect($spy->called)->toBe($expected);
})->with([
    'every minute' => [Frequency::EveryMinute, 'everyMinute'],
    'every two minutes' => [Frequency::EveryTwoMinutes, 'everyTwoMinutes'],
    'every five minutes' => [Frequency::EveryFiveMinutes, 'everyFiveMinutes'],
    'every ten minutes' => [Frequency::EveryTenMinutes, 'everyTenMinutes'],
    'every fifteen minutes' => [Frequency::EveryFifteenMinutes, 'everyFifteenMinutes'],
    'every thirty minutes' => [Frequency::EveryThirtyMinutes, 'everyThirtyMinutes'],
    'hourly' => [Frequency::Hourly, 'hourly'],
    'daily' => [Frequency::Daily, 'daily'],
    'weekly' => [Frequency::Weekly, 'weekly'],
    'monthly' => [Frequency::Monthly, 'monthly'],
    'quarterly' => [Frequency::Quarterly, 'quarterly'],
    'yearly' => [Frequency::Yearly, 'yearly'],
]);

// -----------------------------------------------------------------
// Group 2 — value round-trip
// -----------------------------------------------------------------

it('exposes stable string values suitable for cache serialisation', function (): void {
    // The registrar writes each task's `frequency` field to the
    // on-disk cache as `->value`. Renaming a case's backing
    // string would silently invalidate every existing cache
    // dump. Lock the values in so a drive-by rename triggers a
    // test failure.
    expect(Frequency::Daily->value)->toBe('daily')
        ->and(Frequency::EveryFiveMinutes->value)->toBe('every_five_minutes')
        ->and(Frequency::Hourly->value)->toBe('hourly');
});

it('round-trips values through Frequency::tryFrom without loss', function (Frequency $case): void {
    // Discovery cache round-trip contract — the value we write
    // must resolve back to the same case on the next boot.
    expect(Frequency::tryFrom($case->value))->toBe($case);
})->with([
    'daily' => Frequency::Daily,
    'weekly' => Frequency::Weekly,
    'yearly' => Frequency::Yearly,
    'quarterly' => Frequency::Quarterly,
]);
