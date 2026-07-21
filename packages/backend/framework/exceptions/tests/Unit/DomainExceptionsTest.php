<?php

/**
 * @file packages/exceptions/tests/Unit/DomainExceptionsTest.php
 *
 * @description
 * Unit coverage for the domain-layer exception family:
 *
 *   - {@see \Stackra\Exceptions\Domain\DomainException} — the base.
 *   - {@see \Stackra\Exceptions\Domain\BusinessRuleException} — a
 *     named rule with a `rule_id`.
 *   - {@see \Stackra\Exceptions\Domain\InvariantViolationException}
 *     — an impossible state was reached (5xx bugs, `Critical`).
 *   - {@see \Stackra\Exceptions\Domain\TenantException} — tenancy
 *     scope errors, escalating to `Security` on cross-tenant access.
 *
 * ## Why the tenancy tests matter
 *
 * `TenantException::crossTenantAccess()` is the security-sensitive
 * factory in this family. It bumps severity to `Alert` and category
 * to `Security` so audit dashboards + Sentry security channels see
 * every attempt. A regression that leaves the class defaults in
 * place would silently downgrade a genuine incident signal.
 *
 * ## Translation keys use the split layout
 *
 * `exceptions::domain.*` — file `domain`, key inside. Tenancy is
 * kept inside the same domain file for now: `domain.tenancy`,
 * `domain.tenancy_missing`, `domain.tenancy_cross_tenant`.
 */

declare(strict_types=1);

use Stackra\Exceptions\Domain\BusinessRuleException;
use Stackra\Exceptions\Domain\DomainException;
use Stackra\Exceptions\Domain\InvariantViolationException;
use Stackra\Exceptions\Domain\TenantException;
use Stackra\Exceptions\Enums\ErrorCategory;
use Stackra\Exceptions\Enums\ErrorSeverity;
use Stackra\Foundation\Support\CorrelationId;

afterEach(function (): void {
    CorrelationId::forget();
});

// -----------------------------------------------------------------
// DomainException — base class metadata
// -----------------------------------------------------------------

it('DomainException carries Business + Info + 422 metadata', function (): void {
    $e = DomainException::make();

    // Category `Business` groups every "semantic" failure regardless
    // of subclass. Info severity because domain violations are
    // expected control flow.
    expect($e->errorCode())->toBe('domain.rule_violated')
        ->and($e->httpStatus())->toBe(422)
        ->and($e->severity())->toBe(ErrorSeverity::Info)
        ->and($e->category())->toBe(ErrorCategory::Business)
        ->and($e->translationKey())->toBe('exceptions::domain.rule_violated');
});

// -----------------------------------------------------------------
// BusinessRuleException::ruleFailed
// -----------------------------------------------------------------

it('BusinessRuleException carries Business + Info + 422 metadata', function (): void {
    $e = BusinessRuleException::make();

    expect($e)->toBeInstanceOf(DomainException::class)
        ->and($e->errorCode())->toBe('domain.business_rule')
        ->and($e->httpStatus())->toBe(422)
        ->and($e->severity())->toBe(ErrorSeverity::Info)
        ->and($e->category())->toBe(ErrorCategory::Business)
        ->and($e->translationKey())->toBe('exceptions::domain.business_rule');
});

it('BusinessRuleException::ruleFailed without description uses a generated dev message', function (): void {
    $e = BusinessRuleException::ruleFailed('billing.trial_only_once');

    expect($e)->toBeInstanceOf(BusinessRuleException::class)
        // Generated dev message follows a stable template so grep
        // works.
        ->and($e->getMessage())->toBe('Business rule [billing.trial_only_once] failed.')
        ->and($e->context())->toMatchArray(['rule_id' => 'billing.trial_only_once'])
        // Named factory swaps to a more specific translation key.
        ->and($e->translationKey())->toBe('exceptions::domain.business_rule_named')
        ->and($e->translationParameters())->toMatchArray(['rule_id' => 'billing.trial_only_once']);
});

it('BusinessRuleException::ruleFailed with description uses it as the dev message', function (): void {
    // Caller-supplied description wins over the generated template.
    $e = BusinessRuleException::ruleFailed('billing.trial', 'Trial already used.');

    expect($e->getMessage())->toBe('Trial already used.')
        ->and($e->context()['rule_id'])->toBe('billing.trial');
});

// -----------------------------------------------------------------
// InvariantViolationException::assertionFailed
// -----------------------------------------------------------------

it('InvariantViolationException carries Business + Critical + 500 metadata', function (): void {
    $e = InvariantViolationException::make();

    // 500 with Critical severity — the reporter pipeline routes
    // these to the alerting channel because "impossible state" is
    // always a bug worth waking someone for.
    expect($e->errorCode())->toBe('domain.invariant_violation')
        ->and($e->httpStatus())->toBe(500)
        ->and($e->severity())->toBe(ErrorSeverity::Critical)
        ->and($e->category())->toBe(ErrorCategory::Business)
        ->and($e->translationKey())->toBe('exceptions::domain.invariant_violation');
});

it('InvariantViolationException::assertionFailed records the description in context and message', function (): void {
    $e = InvariantViolationException::assertionFailed('one-and-only-one row expected, found 2');

    // The description lands both in the developer message (for
    // logs / Sentry) and in `context.assertion` (for dashboards
    // that group by the specific invariant).
    expect($e)->toBeInstanceOf(InvariantViolationException::class)
        ->and($e->context())->toMatchArray([
            'assertion' => 'one-and-only-one row expected, found 2',
        ])
        ->and($e->getMessage())->toContain('one-and-only-one row expected, found 2');
});

// -----------------------------------------------------------------
// TenantException — class-level metadata
// -----------------------------------------------------------------

it('TenantException carries Tenancy + Warning + 400 metadata', function (): void {
    $e = TenantException::make();

    // 400 because a missing tenant is a client-wiring problem, not
    // a permissions issue. `Tenancy` category so dashboards can
    // isolate multi-tenancy traffic.
    expect($e->errorCode())->toBe('tenancy.violation')
        ->and($e->httpStatus())->toBe(400)
        ->and($e->severity())->toBe(ErrorSeverity::Warning)
        ->and($e->category())->toBe(ErrorCategory::Tenancy)
        ->and($e->translationKey())->toBe('exceptions::domain.tenancy');
});

// -----------------------------------------------------------------
// TenantException::missingTenant
// -----------------------------------------------------------------

it('TenantException::missingTenant points at the tenancy_missing translation key', function (): void {
    $e = TenantException::missingTenant();

    // Class metadata carries over — only the translation key
    // narrows to the specific case.
    expect($e)->toBeInstanceOf(TenantException::class)
        ->and($e->translationKey())->toBe('exceptions::domain.tenancy_missing')
        ->and($e->severity())->toBe(ErrorSeverity::Warning)
        ->and($e->category())->toBe(ErrorCategory::Tenancy);
});

// -----------------------------------------------------------------
// TenantException::crossTenantAccess — SEVERITY + CATEGORY escalation
// -----------------------------------------------------------------

it('TenantException::crossTenantAccess escalates severity to Alert and category to Security', function (): void {
    $e = TenantException::crossTenantAccess(1, 2);

    // This is the load-bearing invariant of the whole class — a
    // cross-tenant access attempt MUST land on the security channel
    // with Alert severity. Downgrading either would silently defang
    // the audit trail.
    expect($e)->toBeInstanceOf(TenantException::class)
        ->and($e->severity())->toBe(ErrorSeverity::Alert)
        ->and($e->category())->toBe(ErrorCategory::Security)
        ->and($e->translationKey())->toBe('exceptions::domain.tenancy_cross_tenant')
        ->and($e->context())->toMatchArray([
            'requested_tenant' => 1,
            'actual_tenant' => 2,
        ]);
});

it('TenantException::crossTenantAccess accepts string tenant identifiers', function (): void {
    // Tenants are commonly ULIDs or slugs — the union type on the
    // factory tolerates both int and string.
    $e = TenantException::crossTenantAccess('tenant_a', 'tenant_b');

    expect($e->context())->toMatchArray([
        'requested_tenant' => 'tenant_a',
        'actual_tenant' => 'tenant_b',
    ]);
});
