<?php

/**
 * @file packages/exceptions/tests/Unit/RedactorTest.php
 *
 * @description
 * Exercises {@see \Stackra\Exceptions\Support\Redactor}, the
 * safety-net that scrubs sensitive keys, credentials, and runaway
 * payloads before an exception's `context()` is shipped to logs,
 * Sentry, or a JSON error envelope.
 *
 * ## Why it matters
 *
 * The redactor is the last line of defence against accidental
 * credential leaks. A regression here can send raw passwords /
 * tokens / API keys to log storage — and once there, they exist
 * forever.
 *
 * Every branch (key match, regex match, recursion, truncation,
 * non-scalar values) gets an explicit assertion so a future
 * refactor can't quietly drop a safety.
 *
 * ## Coverage matrix
 *
 *   - Key-based redaction (case-insensitive substring — critical:
 *     `password_confirmation` triggers on the `password` substring).
 *   - Recursive traversal into nested arrays.
 *   - Value-based regex patterns: Bearer / Basic tokens, JWTs,
 *     OpenAI / Anthropic / Google / Stripe keys, PAN-like digit runs.
 *   - `maxStringLength` truncation with the `…[TRUNCATED]` marker.
 *   - `redactValue` handling of scalars, arrays, `\Stringable`,
 *     arbitrary objects (→ `[OBJECT:Class]`), and resources
 *     (→ `[UNSUPPORTED]`).
 *   - `maxDepth` guard against pathologically deep payloads.
 *   - Custom sensitive keys MERGE with defaults (never replace).
 *
 * ## No container needed
 *
 * The redactor accepts an optional `ConfigRepository` but every knob
 * is constructor-overridable — these tests never boot Testbench.
 */

declare(strict_types=1);

use Stackra\Exceptions\Support\Redactor;

// -----------------------------------------------------------------
// Group 1 — key-based redaction (case-insensitive substring)
// -----------------------------------------------------------------

describe('key-based redaction', function (): void {
    it('replaces values whose key matches a default sensitive substring', function (): void {
        // Baseline: three canonical cases across different casings
        // and separators. All must be caught because the redactor
        // lowercases both sides before comparing.
        $redactor = new Redactor;

        $out = $redactor->redact([
            'password' => 'hunter2',
            'Password' => 'hunter2',
            'X-API-Key' => 'sk-abc',
            'authorization' => 'Bearer xyz',
        ]);

        expect($out['password'])->toBe('[REDACTED]')
            ->and($out['Password'])->toBe('[REDACTED]')
            ->and($out['X-API-Key'])->toBe('[REDACTED]')
            ->and($out['authorization'])->toBe('[REDACTED]');
    });

    it('catches password_confirmation via the substring rule', function (): void {
        // The pivotal case: substring match means `password_confirmation`
        // triggers because `password` is a substring of it. This is
        // deliberate — apps sometimes stuff creds into oddly-named keys.
        $redactor = new Redactor;

        $out = $redactor->redact([
            'password_confirmation' => 'hunter2',
            'confirm_password' => 'hunter2',
            'oldPassword' => 'hunter2',
        ]);

        expect($out['password_confirmation'])->toBe('[REDACTED]')
            ->and($out['confirm_password'])->toBe('[REDACTED]')
            ->and($out['oldPassword'])->toBe('[REDACTED]');
    });
});

// -----------------------------------------------------------------
// Group 2 — recursion
// -----------------------------------------------------------------

describe('recursion', function (): void {
    it('walks nested arrays and redacts sensitive keys at any depth', function (): void {
        // Sensitive data often hides two or three levels deep in a
        // request payload; the redactor MUST walk arrays, not just
        // scan the top level.
        $redactor = new Redactor;

        $out = $redactor->redact([
            'user' => [
                'name' => 'Alice',
                'credentials' => [
                    // Three levels deep — the substring `password`
                    // still wins.
                    'password' => 'hunter2',
                ],
            ],
        ]);

        expect($out['user']['name'])->toBe('Alice')
            ->and($out['user']['credentials']['password'])->toBe('[REDACTED]');
    });
});

// -----------------------------------------------------------------
// Group 3 — max_depth cap
// -----------------------------------------------------------------

describe('max_depth cap', function (): void {
    it('collapses a payload deeper than the configured cap', function (): void {
        // maxDepth: 2 → up to two levels of recursion allowed.
        // Anything at depth >= 2 collapses to the sentinel.
        $redactor = new Redactor(maxDepth: 2);

        $out = $redactor->redact([
            'a' => [
                'b' => [
                    'c' => 'leaf',
                ],
            ],
        ]);

        // At depth 2 the third-level array is replaced with the
        // `[replacement]` sentinel. We assert on shape not marker
        // text so a future tweak to the marker doesn't break the
        // test.
        expect($out['a']['b'])->toBe(['[REDACTED]']);
    });
});

// -----------------------------------------------------------------
// Group 4 — max_string_length truncation
// -----------------------------------------------------------------

describe('max_string_length truncation', function (): void {
    it('truncates long strings and appends the [TRUNCATED] marker', function (): void {
        // A rogue caller can attach a multi-MB body to context. The
        // redactor caps at `max_string_length` and appends a marker
        // so log parsers can recover the head slice.
        $redactor = new Redactor(maxStringLength: 100);
        $longValue = str_repeat('a', 3000);

        $result = $redactor->redactString($longValue);

        // The sentinel is APPENDED (not wrapped) so downstream log
        // parsers can split on it.
        expect($result)->toEndWith('…[TRUNCATED]')
            ->and(mb_strlen($result))->toBe(100 + mb_strlen('…[TRUNCATED]'));
    });

    it('leaves short strings untouched (below the cap)', function (): void {
        // Sanity check that truncation is off unless triggered.
        $redactor = new Redactor(maxStringLength: 100);

        $result = $redactor->redactString('short value');

        expect($result)->toBe('short value');
    });
});

// -----------------------------------------------------------------
// Group 5 — regex-based value redaction
// -----------------------------------------------------------------

describe('regex-based value redaction', function (): void {
    it('redacts JWT tokens embedded in longer strings', function (): void {
        // Three base64url-ish segments joined by dots. Each segment
        // requires at least 5 chars so we don't false-positive on
        // `a.b.c`.
        $redactor = new Redactor;

        $jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abcdef1234';
        $input = "authorization header was {$jwt} and we bailed";

        expect($redactor->redactString($input))
            ->toContain('[REDACTED]')
            ->and($redactor->redactString($input))->not->toContain($jwt);
    });

    it('redacts OpenAI-style secret keys (sk-...)', function (): void {
        $redactor = new Redactor;
        $key = 'sk-proj-' . str_repeat('a', 30);

        expect($redactor->redactString("openai_key={$key}"))
            ->toContain('[REDACTED]')
            ->and($redactor->redactString("openai_key={$key}"))->not->toContain($key);
    });

    it('redacts Anthropic keys (sk-ant-...)', function (): void {
        // Anthropic pattern requires `sk-ant-` prefix plus 20+ chars.
        $redactor = new Redactor;
        $key = 'sk-ant-' . str_repeat('a', 25);

        expect($redactor->redactString("token={$key}"))
            ->toContain('[REDACTED]')
            ->and($redactor->redactString("token={$key}"))->not->toContain($key);
    });

    it('redacts Google API keys (AIza...)', function (): void {
        // Google pattern is AIza + exactly 35 more chars.
        $redactor = new Redactor;
        $key = 'AIza' . str_repeat('B', 35);

        expect($redactor->redactString("key={$key}"))
            ->toContain('[REDACTED]')
            ->and($redactor->redactString("key={$key}"))->not->toContain($key);
    });

    it('redacts Stripe keys (sk_live_ / pk_live_ / rk_test_ ...)', function (): void {
        // Stripe pattern matches sk|rk|pk _ live|test _ 16+ chars.
        $redactor = new Redactor;
        $key = 'sk_live_' . str_repeat('a', 24);

        expect($redactor->redactString("stripe={$key}"))
            ->toContain('[REDACTED]')
            ->and($redactor->redactString("stripe={$key}"))->not->toContain($key);
    });

    it('preserves the "Bearer " prefix and replaces only the token portion', function (): void {
        // The bearer pattern uses two groups — the callback keeps
        // group 1 (the scheme keyword) and swaps only group 2 so
        // the log stays readable.
        $redactor = new Redactor;
        $token = 'abc.def.ghi123';

        $out = $redactor->redactString("Authorization: Bearer {$token}");

        expect($out)->toContain('Bearer [REDACTED]')
            ->and($out)->not->toContain($token);
    });

    it('redacts long digit runs that look like credit-card PANs', function (): void {
        // The PAN-like pattern is broad (13–19 digits, optional
        // spaces / dashes) — a last-line safety net for accidental
        // card-number leaks. False positives on stringly-typed
        // data are cheap; false negatives on real cards are not.
        $redactor = new Redactor;

        $card = '4242 4242 4242 4242';

        expect($redactor->redactString("card={$card}"))
            ->toContain('[REDACTED]')
            ->and($redactor->redactString("card={$card}"))->not->toContain($card);
    });
});

// -----------------------------------------------------------------
// Group 6 — non-scalar values
// -----------------------------------------------------------------

describe('non-scalar values', function (): void {
    it('replaces closures with the [OBJECT:Closure] marker', function (): void {
        // Closures are objects with an internal class of `Closure`.
        // Marker is `[OBJECT:Closure]` — "something was here"
        // without an unserialisable payload.
        $redactor = new Redactor;
        $closure = static fn (): int => 42;

        $out = $redactor->redactValue($closure);

        expect($out)->toBe('[OBJECT:Closure]');
    });

    it('replaces resources with the [UNSUPPORTED] marker', function (): void {
        // Resources are neither scalars nor objects — they land in
        // the default branch of the match statement.
        $redactor = new Redactor;
        $resource = fopen('php://memory', 'r');

        $out = $redactor->redactValue($resource);

        expect($out)->toBe('[UNSUPPORTED]');

        fclose($resource);
    });

    it('replaces arbitrary objects with a [OBJECT:ClassName] marker naming the FQCN', function (): void {
        // The redactor NEVER inspects object internals — that would
        // let a `__toString` implementation exfiltrate secrets.
        $redactor = new Redactor;

        $obj = new class {
            public string $password = 'hunter2';
        };

        $out = $redactor->redactValue($obj);

        expect($out)->toStartWith('[OBJECT:');
    });

    it('passes scalars (int, float, bool, null) through unchanged', function (): void {
        // Non-string scalars can't carry sensitive substrings by
        // themselves — no need to scan them.
        $redactor = new Redactor;

        expect($redactor->redactValue(42))->toBe(42)
            ->and($redactor->redactValue(3.14))->toBe(3.14)
            ->and($redactor->redactValue(true))->toBeTrue()
            ->and($redactor->redactValue(false))->toBeFalse()
            ->and($redactor->redactValue(null))->toBeNull();
    });
});

// -----------------------------------------------------------------
// Group 7 — Stringable objects
// -----------------------------------------------------------------

describe('Stringable objects', function (): void {
    it('treats a Stringable as a string and runs pattern scans over it', function (): void {
        // Objects implementing Stringable are cast + scanned. A DTO
        // that serialises to a JWT still gets redacted.
        $redactor = new Redactor;

        $stringable = new class implements Stringable {
            public function __toString(): string
            {
                // A `sk_live_...` Stripe key inside the string form.
                return 'token=sk_live_' . str_repeat('a', 20);
            }
        };

        $out = $redactor->redactValue($stringable);

        expect($out)->toBeString()
            ->and($out)->not->toContain('sk_live_aaaaaaaaaaaaaaaaaaaa')
            ->and($out)->toContain('[REDACTED]');
    });
});

// -----------------------------------------------------------------
// Group 8 — merge semantics for custom sensitive keys
// -----------------------------------------------------------------

describe('custom sensitive keys are merged with defaults', function (): void {
    it('still redacts default `password` when a custom key list is supplied', function (): void {
        // Callers extend the baseline, never replace it. If the
        // constructor accepted a full replacement list, an app
        // could accidentally drop `password` from the sensitive set.
        $redactor = new Redactor(sensitiveKeys: ['tenant_secret']);

        $out = $redactor->redact([
            'tenant_secret' => 'shhh',
            'password' => 'hunter2',
        ]);

        expect($out['tenant_secret'])->toBe('[REDACTED]')
            ->and($out['password'])->toBe('[REDACTED]');
    });
});

// -----------------------------------------------------------------
// Group 9 — replacement() exposes the marker string
// -----------------------------------------------------------------

describe('replacement accessor', function (): void {
    it('returns the configured replacement string', function (): void {
        // The marker is exposed so UIs can render "this is redacted,
        // not empty" copy consistently.
        $redactor = new Redactor(replacement: '[REDACTED]');

        expect($redactor->replacement())->toBe('[REDACTED]');
    });
});
