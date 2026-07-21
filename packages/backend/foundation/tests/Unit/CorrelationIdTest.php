<?php

declare(strict_types=1);

use Stackra\Foundation\Support\CorrelationId;

afterEach(function (): void {
    CorrelationId::forget();
});

it('is null by default', function (): void {
    expect(CorrelationId::current())->toBeNull();
});

it('round-trips a set value', function (): void {
    CorrelationId::set('req_abc123');

    expect(CorrelationId::current())->toBe('req_abc123');
});

it('generates a ULID-shaped id', function (): void {
    $id = CorrelationId::generate();

    expect($id)->toHaveLength(26)
        ->and($id)->toMatch('/^[0-9A-HJKMNP-TV-Z]{26}$/');
});

it('forget clears the current id', function (): void {
    CorrelationId::set('req_xyz');
    CorrelationId::forget();

    expect(CorrelationId::current())->toBeNull();
});
