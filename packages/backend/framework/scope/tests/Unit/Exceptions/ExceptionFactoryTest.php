<?php

/**
 * @file tests/Unit/Exceptions/ExceptionFactoryTest.php
 *
 * @description
 * Smoke tests for the exception factory methods. Ensures that
 * the named constructors produce messages callers can display
 * without further formatting.
 */

declare(strict_types=1);

use Stackra\Scope\Exceptions\ScopeConflictException;
use Stackra\Scope\Exceptions\ScopeContextRequiredException;
use Stackra\Scope\Exceptions\ScopeException;
use Stackra\Scope\Exceptions\ScopeNotFoundException;
use Stackra\Scope\Exceptions\ScopeValidationException;

uses()->group('unit', 'scope');

it('every specialised exception extends ScopeException', function (): void {
    // A single `catch (ScopeException $e)` in HTTP wrappers must
    // catch every scope-specific failure. Enforce that at the
    // type level.
    expect(is_subclass_of(ScopeContextRequiredException::class, ScopeException::class))->toBeTrue();
    expect(is_subclass_of(ScopeConflictException::class, ScopeException::class))->toBeTrue();
    expect(is_subclass_of(ScopeNotFoundException::class, ScopeException::class))->toBeTrue();
    expect(is_subclass_of(ScopeValidationException::class, ScopeException::class))->toBeTrue();
});

it('ScopeContextRequiredException factory produces a helpful message', function (): void {
    $e = ScopeContextRequiredException::make();

    // The message must reference the middleware alias so the
    // reader knows exactly which piece is missing.
    expect($e->getMessage())->toContain('scope');
    expect($e->getMessage())->toContain('middleware');
});

it('ScopeConflictException::namespaceAlreadyRegistered names the offender', function (): void {
    $e = ScopeConflictException::namespaceAlreadyRegistered('settings');

    expect($e->getMessage())->toContain('settings');
});

it('ScopeNotFoundException factories embed the identifier', function (): void {
    $nodeErr = ScopeNotFoundException::node('some-uuid');
    $defErr = ScopeNotFoundException::definition('owner-a', 'venue');

    expect($nodeErr->getMessage())->toContain('some-uuid');
    expect($defErr->getMessage())->toContain('venue');
    expect($defErr->getMessage())->toContain('owner-a');
});

it('ScopeValidationException factories embed the offending value', function (): void {
    $ns = ScopeValidationException::invalidNamespace('Bad-Name', '/regex/');
    $rej = ScopeValidationException::rejectedByValidator('settings', 'general.timezone');
    $cyc = ScopeValidationException::cycleDetected('venue');

    expect($ns->getMessage())->toContain('Bad-Name');
    expect($rej->getMessage())->toContain('general.timezone');
    expect($cyc->getMessage())->toContain('venue');
});
