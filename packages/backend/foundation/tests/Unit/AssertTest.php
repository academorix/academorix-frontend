<?php

declare(strict_types=1);

use Stackra\Foundation\Support\Assert;

it('passes notEmpty when value is set', function (): void {
    Assert::notEmpty('  hello  ', 'name');
})->throwsNoExceptions();

it('rejects notEmpty on blank strings', function (): void {
    expect(fn () => Assert::notEmpty('   ', 'name'))
        ->toThrow(InvalidArgumentException::class, 'name');
});

it('rejects notEmpty on null', function (): void {
    expect(fn () => Assert::notEmpty(null, 'name'))
        ->toThrow(InvalidArgumentException::class, 'name');
});

it('honours stringLength bounds', function (): void {
    Assert::stringLength('abc', min: 1, max: 3, argument: 'code');

    expect(fn () => Assert::stringLength('ab', min: 3, argument: 'code'))
        ->toThrow(InvalidArgumentException::class, 'shorter');

    expect(fn () => Assert::stringLength('abcd', max: 3, argument: 'code'))
        ->toThrow(InvalidArgumentException::class, 'maximum');
});

it('enforces inRange', function (): void {
    Assert::inRange(5, 1, 10, 'age');

    expect(fn () => Assert::inRange(11, 1, 10, 'age'))
        ->toThrow(InvalidArgumentException::class, 'age');
});

it('enforces oneOf with strict comparison', function (): void {
    Assert::oneOf('a', ['a', 'b'], 'letter');

    expect(fn () => Assert::oneOf('c', ['a', 'b'], 'letter'))
        ->toThrow(InvalidArgumentException::class, 'letter');
});
