<?php

/**
 * @file modules/platform/application/tests/Unit/Enums/BusinessTypeEnumTest.php
 *
 * @description
 * Pure unit tests — no Laravel boot. Exercise BusinessTypeEnum's
 * resolution semantics + default map methods.
 */

declare(strict_types=1);

use Academorix\Application\Enums\BusinessTypeEnum;

it('resolves known slugs into their enum case', function (): void {
    expect(BusinessTypeEnum::resolve('sports_center'))->toBe(BusinessTypeEnum::SportsCenter);
    expect(BusinessTypeEnum::resolve('club'))->toBe(BusinessTypeEnum::Club);
    expect(BusinessTypeEnum::resolve('academy'))->toBe(BusinessTypeEnum::Academy);
    expect(BusinessTypeEnum::resolve('school'))->toBe(BusinessTypeEnum::School);
    expect(BusinessTypeEnum::resolve('gym'))->toBe(BusinessTypeEnum::Gym);
    expect(BusinessTypeEnum::resolve('federation'))->toBe(BusinessTypeEnum::Federation);
    expect(BusinessTypeEnum::resolve('other'))->toBe(BusinessTypeEnum::Other);
});

it('resolves null + empty into Custom', function (): void {
    expect(BusinessTypeEnum::resolve(null))->toBe(BusinessTypeEnum::Custom);
    expect(BusinessTypeEnum::resolve(''))->toBe(BusinessTypeEnum::Custom);
});

it('resolves unknown slugs into Custom (tenant-defined bucket)', function (): void {
    expect(BusinessTypeEnum::resolve('boxing-gym'))->toBe(BusinessTypeEnum::Custom);
    expect(BusinessTypeEnum::resolve('tenant_defined_thing'))->toBe(BusinessTypeEnum::Custom);
});

it('unlocks the full role catalogue for sports variants', function (): void {
    foreach ([
        BusinessTypeEnum::SportsCenter,
        BusinessTypeEnum::Club,
        BusinessTypeEnum::Academy,
        BusinessTypeEnum::School,
        BusinessTypeEnum::Gym,
        BusinessTypeEnum::Federation,
    ] as $case) {
        expect($case->defaultRoles())->toContain('coach', 'athlete', 'medical');
    }
});

it('trims the role catalogue for Other + Custom', function (): void {
    foreach ([BusinessTypeEnum::Other, BusinessTypeEnum::Custom] as $case) {
        expect($case->defaultRoles())->not->toContain('medical');
    }
});

it('overrides terminology per business type', function (): void {
    expect(BusinessTypeEnum::School->defaultTerminology())->toBe(['athletes' => 'Students']);
    expect(BusinessTypeEnum::Gym->defaultTerminology())->toBe(['athletes' => 'Members']);
    expect(BusinessTypeEnum::Federation->defaultTerminology())->toBe([
        'athletes' => 'Athletes',
        'teams'    => 'Clubs',
    ]);
    expect(BusinessTypeEnum::SportsCenter->defaultTerminology())->toBe([]);
});

it('ships an Iconify token for every case', function (): void {
    foreach (BusinessTypeEnum::cases() as $case) {
        expect($case->iconToken())->toBeString()->not->toBeEmpty();
    }
});
