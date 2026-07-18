<?php

/**
 * @file tests/Unit/Services/ScopeRegistryTest.php
 *
 * @description
 * Unit tests for {@see \Academorix\Scope\Services\ScopeRegistry}
 * — namespace validation, duplicate rejection, deterministic
 * enumeration.
 */

declare(strict_types=1);

use Academorix\Scope\Data\ScopeConsumerConfig;
use Academorix\Scope\Exceptions\ScopeConflictException;
use Academorix\Scope\Exceptions\ScopeValidationException;
use Academorix\Scope\Services\ScopeRegistry;
use Illuminate\Config\Repository as ConfigRepository;

uses()->group('unit', 'scope');

/**
 * Fresh registry per test — the constructor snapshot of the regex
 * means we need a new instance if we want to tweak the regex.
 */
function makeRegistry(?string $regexOverride = null): ScopeRegistry
{
    $config = new ConfigRepository();
    if ($regexOverride !== null) {
        $config->set('scope.namespace_regex', $regexOverride);
    }

    return new ScopeRegistry($config);
}

it('accepts a valid namespace and returns its config', function (): void {
    $registry = makeRegistry();
    $config = new ScopeConsumerConfig();

    $registry->consumer('settings', $config);

    expect($registry->get('settings'))->toBe($config);
    expect($registry->has('settings'))->toBeTrue();
});

it('rejects an invalid namespace with a validation error', function (): void {
    makeRegistry()->consumer('Settings-With-Caps', new ScopeConsumerConfig());
})->throws(ScopeValidationException::class);

it('rejects a namespace starting with a digit', function (): void {
    makeRegistry()->consumer('9fields', new ScopeConsumerConfig());
})->throws(ScopeValidationException::class);

it('rejects a namespace exceeding 64 chars', function (): void {
    makeRegistry()->consumer(str_repeat('a', 65), new ScopeConsumerConfig());
})->throws(ScopeValidationException::class);

it('rejects double registration for the same namespace', function (): void {
    $registry = makeRegistry();
    $registry->consumer('settings', new ScopeConsumerConfig());
    // Second registration MUST fail loud — a silent overwrite
    // would let two packages fight for the same namespace with
    // whichever booted last winning arbitrarily.
    $registry->consumer('settings', new ScopeConsumerConfig());
})->throws(ScopeConflictException::class);

it('returns null for an unknown namespace', function (): void {
    $registry = makeRegistry();

    expect($registry->get('never_registered'))->toBeNull();
    expect($registry->has('never_registered'))->toBeFalse();
});

it('returns namespaces sorted alphabetically', function (): void {
    $registry = makeRegistry();

    // Register out of order to prove the sort works.
    $registry->consumer('permissions', new ScopeConsumerConfig());
    $registry->consumer('audit', new ScopeConsumerConfig());
    $registry->consumer('settings', new ScopeConsumerConfig());

    expect($registry->all())->toBe(['audit', 'permissions', 'settings']);
});

it('honors a custom namespace regex from config', function (): void {
    // Widen the regex to accept CamelCase — the registry snaps
    // the value at construction time.
    $registry = makeRegistry('/^[A-Za-z][A-Za-z0-9_]{0,63}$/');

    $registry->consumer('Settings', new ScopeConsumerConfig());

    expect($registry->has('Settings'))->toBeTrue();
});
