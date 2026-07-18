<?php

/**
 * @file packages/exceptions/tests/Unit/TraceCleanerTest.php
 *
 * @description
 * Exercises {@see \Academorix\Exceptions\Support\TraceCleaner}, which
 * turns a raw PHP stack trace into the shape the JSON debug envelope
 * and Ignition solutions providers expect: relative paths, no
 * argument leaks, capped length, optional vendor collapsing.
 *
 * ## Why every branch matters
 *
 *   - **Argument stripping** — the raw `getTrace()` output embeds
 *     every caller's positional arguments. A common credential-leak
 *     vector.
 *   - **Path normalisation** — absolute paths leak deployment
 *     layout to whoever reads a Sentry event.
 *   - **Vendor collapse** — long framework stacks bury the actual
 *     call site.
 *   - **Frame cap** — a runaway recursion would ship a megabyte of
 *     stack to Sentry without the cap.
 *   - **Documented shape** — every cleaned frame carries the same
 *     key set (`file`, `line`, `function`, `class`, `type`,
 *     `source`) so downstream consumers can index without
 *     defensive `isset()` calls.
 *
 * ## A note on synthesised traces
 *
 * PHP's `Exception::$trace` is set at throw time and `getTrace()` is
 * `final`. To exercise scenarios like "consecutive vendor frames",
 * we use reflection on `\Exception` to install a hand-crafted trace
 * onto a throwable before cleaning. Fragile — but the alternative
 * is running actual code under `/vendor/` which requires vendor to
 * be present at test time.
 */

declare(strict_types=1);

use Academorix\Exceptions\Support\TraceCleaner;

/**
 * Helper: build a real Throwable with a synthesised trace payload.
 * We overwrite `Exception::$trace` via reflection so cleaners see
 * the frames we want to test against.
 *
 * @param  list<array<string, mixed>>  $frames
 */
function traceCleaner_makeExceptionWithTrace(array $frames, string $message = 'boom'): RuntimeException
{
    $e = new RuntimeException($message);

    // `$trace` lives on the parent `\Exception` as private. Reflection
    // lets us set it despite the accessibility.
    $prop = new ReflectionProperty(Exception::class, 'trace');
    $prop->setAccessible(true);
    $prop->setValue($e, $frames);

    return $e;
}

// -----------------------------------------------------------------
// Group 1 — canonical frame shape
// -----------------------------------------------------------------

describe('cleaned frame shape', function (): void {
    it('returns frames with the documented key set', function (): void {
        // Every downstream consumer indexes on the same key set —
        // asserting shape here means no defensive `isset()` calls
        // are needed elsewhere.
        $cleaner = new TraceCleaner(stripPaths: false);

        $frames = $cleaner->clean(traceCleaner_makeExceptionWithTrace([
            [
                'file' => '/app/src/Foo.php',
                'line' => 12,
                'function' => 'bar',
                'class' => 'Foo',
                'type' => '->',
                // `args` is present in the raw trace — the cleaner
                // MUST drop it. Included here to prove the drop.
                'args' => ['secret-arg'],
            ],
        ]));

        expect($frames)->toHaveCount(1)
            ->and($frames[0])->toHaveKeys(['file', 'line', 'function', 'class', 'type', 'source'])
            ->and($frames[0]['file'])->toBe('/app/src/Foo.php')
            ->and($frames[0]['line'])->toBe(12)
            ->and($frames[0]['function'])->toBe('bar')
            ->and($frames[0]['class'])->toBe('Foo')
            ->and($frames[0]['type'])->toBe('->')
            ->and($frames[0]['source'])->toBe('app');
    });
});

// -----------------------------------------------------------------
// Group 2 — arguments must never surface
// -----------------------------------------------------------------

describe('argument stripping', function (): void {
    it('drops the args key from every cleaned frame', function (): void {
        // A caller like `login('alice', 'hunter2')` records `hunter2`
        // in the trace. Dropping `args` is the cheapest way to keep
        // that out of the wire.
        $cleaner = new TraceCleaner(stripPaths: false);

        $frames = $cleaner->clean(traceCleaner_makeExceptionWithTrace([
            ['file' => '/app/src/Login.php', 'line' => 3, 'function' => 'login', 'args' => ['alice', 'hunter2']],
            ['file' => '/app/src/Handler.php', 'line' => 4, 'function' => '__invoke', 'args' => ['payload']],
        ]));

        // Walking every frame — a regression that drops `args` on
        // the last frame only would slip past a single-frame check.
        foreach ($frames as $frame) {
            expect($frame)->not->toHaveKey('args');
        }
    });
});

// -----------------------------------------------------------------
// Group 3 — path normalisation
// -----------------------------------------------------------------

describe('path normalisation', function (): void {
    it('rewrites project-relative paths when stripPaths=true', function (): void {
        // The canonical stripping case from the task description:
        // `/var/www/html/app/User.php` → `app/User.php`.
        $cleaner = new TraceCleaner(
            stripPaths: true,
            basePath: '/var/www/html',
        );

        $frames = $cleaner->clean(traceCleaner_makeExceptionWithTrace([
            ['file' => '/var/www/html/app/User.php', 'line' => 42, 'function' => 'save'],
        ]));

        expect($frames[0]['file'])->toBe('app/User.php');
    });

    it('rewrites vendor paths to `vendor/...` when outside the base path', function (): void {
        // A vendor file that lives outside the project root (e.g. in
        // a globally-installed composer cache) still collapses to a
        // `vendor/...` marker rather than leaking the absolute path.
        $cleaner = new TraceCleaner(
            stripPaths: true,
            basePath: '/project',
        );

        $frames = $cleaner->clean(traceCleaner_makeExceptionWithTrace([
            ['file' => '/other/vendor/pkg/B.php', 'line' => 2, 'function' => 'b'],
        ]));

        expect($frames[0]['file'])->toBe('vendor/pkg/B.php');
    });

    it('leaves paths unchanged when stripPaths=false', function (): void {
        // Local development wants full paths so debuggers can jump.
        $cleaner = new TraceCleaner(
            stripPaths: false,
            basePath: '/project',
        );

        $frames = $cleaner->clean(traceCleaner_makeExceptionWithTrace([
            ['file' => '/project/src/A.php', 'line' => 1, 'function' => 'a'],
        ]));

        expect($frames[0]['file'])->toBe('/project/src/A.php');
    });
});

// -----------------------------------------------------------------
// Group 4 — vendor classification
// -----------------------------------------------------------------

describe('vendor detection', function (): void {
    it('classifies a frame containing /vendor/ as source=vendor', function (): void {
        // Every downstream consumer uses `source` to decide whether
        // to hide or highlight a frame.
        $cleaner = new TraceCleaner(stripPaths: false);

        $frames = $cleaner->clean(traceCleaner_makeExceptionWithTrace([
            ['file' => '/project/vendor/laravel/framework/src/X.php', 'line' => 1, 'function' => 'handle'],
        ]));

        expect($frames[0]['source'])->toBe('vendor');
    });

    it('classifies a frame without a file entry as source=internal', function (): void {
        // Frames from `call_user_func`, closures, and spl callbacks
        // often lack a `file` — we tag those as `internal` so the
        // renderer can filter or highlight them separately.
        $cleaner = new TraceCleaner(stripPaths: false);

        $frames = $cleaner->clean(traceCleaner_makeExceptionWithTrace([
            ['function' => '{closure}', 'line' => 0],
        ]));

        expect($frames[0]['source'])->toBe('internal')
            ->and($frames[0]['file'])->toBeNull();
    });
});

// -----------------------------------------------------------------
// Group 5 — collapseVendor
// -----------------------------------------------------------------

describe('collapseVendor', function (): void {
    it('folds consecutive vendor frames into a single line', function (): void {
        // Framework stacks bury the real call site — collapsing
        // vendor runs surfaces it higher in the trace.
        $cleaner = new TraceCleaner(
            stripPaths: false,
            collapseVendor: true,
        );

        $frames = $cleaner->clean(traceCleaner_makeExceptionWithTrace([
            ['file' => '/x/vendor/laravel/router.php', 'line' => 1, 'function' => 'a'],
            ['file' => '/x/vendor/laravel/pipeline.php', 'line' => 2, 'function' => 'b'],
            ['file' => '/x/vendor/laravel/kernel.php', 'line' => 3, 'function' => 'c'],
            // Then an app frame — must survive as-is.
            ['file' => '/x/app/Controller.php', 'line' => 4, 'function' => 'index'],
        ]));

        // First vendor frame + the app frame = 2 total.
        expect($frames)->toHaveCount(2)
            ->and($frames[0]['source'])->toBe('vendor')
            ->and($frames[1]['source'])->toBe('app');
    });

    it('keeps consecutive vendor frames when collapseVendor is disabled', function (): void {
        // Sanity: opt-in flag, off by default.
        $cleaner = new TraceCleaner(
            stripPaths: false,
            collapseVendor: false,
        );

        $frames = $cleaner->clean(traceCleaner_makeExceptionWithTrace([
            ['file' => '/x/vendor/a.php', 'line' => 1, 'function' => 'a'],
            ['file' => '/x/vendor/b.php', 'line' => 2, 'function' => 'b'],
        ]));

        expect($frames)->toHaveCount(2);
    });
});

// -----------------------------------------------------------------
// Group 6 — maxFrames
// -----------------------------------------------------------------

describe('maxFrames', function (): void {
    it('caps the returned frame count at the configured maximum', function (): void {
        // Runaway recursion would ship a megabyte of stack to
        // Sentry without the cap.
        $cleaner = new TraceCleaner(
            stripPaths: false,
            maxFrames: 3,
        );

        // Build 10 frames — cleaner must return exactly 3.
        $raw = [];
        for ($i = 0; $i < 10; $i++) {
            $raw[] = ['file' => "/f/{$i}.php", 'line' => $i, 'function' => "fn{$i}"];
        }

        $frames = $cleaner->clean(traceCleaner_makeExceptionWithTrace($raw));

        expect($frames)->toHaveCount(3);
    });
});

// -----------------------------------------------------------------
// Group 7 — describe()
// -----------------------------------------------------------------

describe('describe()', function (): void {
    it('returns the documented top-level shape', function (): void {
        // The full envelope shape: class / message / file / line /
        // trace / previous.
        $cleaner = new TraceCleaner(stripPaths: false);

        $out = $cleaner->describe(new RuntimeException('root'));

        expect($out)->toHaveKeys(['class', 'message', 'file', 'line', 'trace', 'previous'])
            ->and($out['class'])->toBe(RuntimeException::class)
            ->and($out['message'])->toBe('root')
            // No previous → key present with a null value.
            ->and($out['previous'])->toBeNull();
    });

    it('recursively describes the previous chain', function (): void {
        // Exceptions rethrown with `$previous` carry the original
        // cause. `describe()` MUST recurse so downstream consumers
        // see the full chain in one payload.
        $cleaner = new TraceCleaner(stripPaths: false);

        $cause = new RuntimeException('root cause');
        $wrapper = new RuntimeException('wrapper', 0, $cause);

        $out = $cleaner->describe($wrapper);

        expect($out['previous'])->toBeArray()
            // Mirror shape — same key set as the outer frame.
            ->and($out['previous'])->toHaveKeys(['class', 'message', 'file', 'line', 'trace', 'previous'])
            ->and($out['previous']['class'])->toBe(RuntimeException::class)
            ->and($out['previous']['message'])->toBe('root cause');
    });

    it('honours stripPaths for the exception file in describe()', function (): void {
        // Consistency check — the outer frame's `file` follows the
        // same normalisation rules as individual trace frames.
        $cleaner = new TraceCleaner(
            stripPaths: true,
            basePath: '/var/www/html',
        );

        $e = new RuntimeException('boom');
        // Overwrite `file` via reflection so we're not tied to the
        // real filesystem layout of the test runner.
        $prop = new ReflectionProperty(Exception::class, 'file');
        $prop->setAccessible(true);
        $prop->setValue($e, '/var/www/html/app/Widget.php');

        $out = $cleaner->describe($e);

        expect($out['file'])->toBe('app/Widget.php');
    });
});
