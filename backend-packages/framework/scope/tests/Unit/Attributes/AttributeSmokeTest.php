<?php

/**
 * @file tests/Unit/Attributes/AttributeSmokeTest.php
 *
 * @description
 * Cheap constructor smoke tests for every attribute class.
 * Catches obvious mistakes (renamed constructor params, wrong
 * default types) without booting the container.
 */

declare(strict_types=1);

use Academorix\Scope\Attributes\AsScopeResolver;
use Academorix\Scope\Attributes\BypassScope;
use Academorix\Scope\Attributes\ScopedTo;

uses()->group('unit', 'scope');

it('constructs #[ScopedTo] with a nullable level', function (): void {
    $a = new ScopedTo();
    $b = new ScopedTo(level: 'venue');

    expect($a->level)->toBeNull();
    expect($b->level)->toBe('venue');
});

it('constructs #[BypassScope] with reason + optional ADR ref', function (): void {
    $a = new BypassScope(reason: 'audit report');
    $b = new BypassScope(reason: 'GDPR erasure', adrRef: 'ADR-0021');

    expect($a->reason)->toBe('audit report');
    expect($a->adrRef)->toBeNull();

    expect($b->reason)->toBe('GDPR erasure');
    expect($b->adrRef)->toBe('ADR-0021');
});

it('constructs #[AsScopeResolver] with priority + enabled', function (): void {
    $a = new AsScopeResolver();
    $b = new AsScopeResolver(priority: 200, enabled: false);

    // Defaults: 100 + enabled.
    expect($a->priority)->toBe(100);
    expect($a->enabled)->toBeTrue();

    expect($b->priority)->toBe(200);
    expect($b->enabled)->toBeFalse();
});
