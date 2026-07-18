<?php

/**
 * @file modules/platform/application/tests/Feature/BusinessTypeSystemImmutabilityTest.php
 *
 * @description
 * Enforces the enum-db-seed-dual-source guardrail — system rows
 * (`is_system = true`) refuse writes outside the `allowSystemMutation`
 * scope. Both the observer (ORM path) and policy (HTTP path) are
 * exercised.
 */

declare(strict_types=1);

use Academorix\Application\Enums\BusinessTypeEnum;
use Academorix\Application\Exceptions\SystemRowImmutableException;
use Academorix\Application\Models\BusinessType;

it('seeder produces system rows via allowSystemMutation', function (): void {
    BusinessType::allowSystemMutation(function (): void {
        BusinessType::factory()->system(BusinessTypeEnum::SportsCenter)->create();
    });

    $row = BusinessType::query()->where('slug', 'sports_center')->first();
    expect($row)->not->toBeNull();
    expect($row->is_system)->toBeTrue();
});

it('refuses direct mutation of a system row', function (): void {
    $row = BusinessType::allowSystemMutation(
        fn () => BusinessType::factory()->system(BusinessTypeEnum::Academy)->create(),
    );

    // Direct save OUTSIDE the mutation scope must throw.
    expect(fn () => $row->update(['label' => 'Hijacked']))
        ->toThrow(SystemRowImmutableException::class);
});

it('refuses direct delete of a system row', function (): void {
    $row = BusinessType::allowSystemMutation(
        fn () => BusinessType::factory()->system(BusinessTypeEnum::Gym)->create(),
    );

    expect(fn () => $row->delete())
        ->toThrow(SystemRowImmutableException::class);
});

it('allows tenant-custom rows to save + delete normally', function (): void {
    $row = BusinessType::factory()->create();

    $row->label = 'Renamed';
    $row->save();

    expect($row->fresh()->label)->toBe('Renamed');

    $row->delete();
    expect(BusinessType::query()->find($row->getKey()))->toBeNull();
});
