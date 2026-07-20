<?php

/**
 * @file packages/exceptions/tests/Unit/GuardTest.php
 *
 * @description
 * Unit coverage for {@see \Academorix\Exceptions\Guard}. Each guard is
 * exercised twice — once on the happy path (must not throw) and once
 * on the failing path (must throw `InvariantViolationException` with
 * the argument name preserved in context).
 */

declare(strict_types=1);

use Academorix\Exceptions\Domain\InvariantViolationException;
use Academorix\Exceptions\Guard;

it('notNull passes on a non-null value', function (): void {
    // Guard clauses return `void`; the assertion is "no throw".
    Guard::notNull('anything', 'name');

    expect(true)->toBeTrue();
});

it('notNull throws with argument metadata when value is null', function (): void {
    try {
        Guard::notNull(null, 'user_id', ['scope' => 'billing']);
        $this->fail('Expected InvariantViolationException');
    } catch (InvariantViolationException $e) {
        expect($e->getMessage())->toContain('user_id')
            ->and($e->getMessage())->toContain('non-null')
            ->and($e->context())->toMatchArray([
                'argument' => 'user_id',
                'scope' => 'billing',
            ]);
    }
});

it('notEmpty passes on a non-empty string and a non-empty array', function (): void {
    Guard::notEmpty('foo', 'name');
    Guard::notEmpty(['x'], 'roles');

    expect(true)->toBeTrue();
});

it('notEmpty throws on an empty string', function (): void {
    expect(fn () => Guard::notEmpty('', 'name'))
        ->toThrow(InvariantViolationException::class);
});

it('notEmpty throws on a whitespace-only string', function (): void {
    expect(fn () => Guard::notEmpty("   \t\n", 'name'))
        ->toThrow(InvariantViolationException::class);
});

it('notEmpty throws on an empty array', function (): void {
    try {
        Guard::notEmpty([], 'roles');
        $this->fail('Expected InvariantViolationException');
    } catch (InvariantViolationException $e) {
        expect($e->context()['argument'])->toBe('roles');
    }
});

it('stringLength passes when length sits inside the range', function (): void {
    Guard::stringLength('hello', min: 3, max: 10, argument: 'slug');

    expect(true)->toBeTrue();
});

it('stringLength throws when the value is too short', function (): void {
    try {
        Guard::stringLength('ab', min: 3, max: 10, argument: 'slug');
        $this->fail('Expected InvariantViolationException');
    } catch (InvariantViolationException $e) {
        expect($e->getMessage())->toContain('slug')
            ->and($e->context())->toMatchArray([
                'argument' => 'slug',
                'min' => 3,
                'actual' => 2,
            ]);
    }
});

it('stringLength throws when the value is too long', function (): void {
    try {
        Guard::stringLength('abcdefghij', min: 0, max: 5, argument: 'slug');
        $this->fail('Expected InvariantViolationException');
    } catch (InvariantViolationException $e) {
        expect($e->context())->toMatchArray([
            'argument' => 'slug',
            'max' => 5,
            'actual' => 10,
        ]);
    }
});

it('stringLength accepts a null upper bound', function (): void {
    // With `$max = null` only the lower bound is enforced.
    Guard::stringLength(str_repeat('a', 1000), min: 1, max: null, argument: 'note');

    expect(true)->toBeTrue();
});

it('inRange passes inside the range', function (): void {
    Guard::inRange(5, 0, 10, 'age');

    expect(true)->toBeTrue();
});

it('inRange throws below the minimum', function (): void {
    try {
        Guard::inRange(-1, 0, 10, 'age');
        $this->fail('Expected InvariantViolationException');
    } catch (InvariantViolationException $e) {
        expect($e->context())->toMatchArray([
            'argument' => 'age',
            'min' => 0,
            'max' => 10,
            'actual' => -1,
        ]);
    }
});

it('inRange throws above the maximum', function (): void {
    try {
        Guard::inRange(11, 0, 10, 'age');
        $this->fail('Expected InvariantViolationException');
    } catch (InvariantViolationException $e) {
        expect($e->context()['argument'])->toBe('age');
    }
});

it('oneOf passes when the value is present in the allow-list', function (): void {
    Guard::oneOf('active', ['active', 'archived'], 'status');

    expect(true)->toBeTrue();
});

it('oneOf throws when the value is not in the allow-list', function (): void {
    try {
        Guard::oneOf('deleted', ['active', 'archived'], 'status');
        $this->fail('Expected InvariantViolationException');
    } catch (InvariantViolationException $e) {
        expect($e->getMessage())->toContain('status')
            ->and($e->context())->toMatchArray([
                'argument' => 'status',
                'allowed' => ['active', 'archived'],
            ]);
    }
});

it('that passes when the condition is true', function (): void {
    Guard::that(1 + 1 === 2, 'basic arithmetic must hold');

    expect(true)->toBeTrue();
});

it('that throws when the condition is false, echoing the message', function (): void {
    try {
        Guard::that(false, 'invariant.x must hold', ['invariant' => 'x']);
        $this->fail('Expected InvariantViolationException');
    } catch (InvariantViolationException $e) {
        expect($e->getMessage())->toContain('invariant.x must hold')
            ->and($e->context()['invariant'])->toBe('x');
    }
});
