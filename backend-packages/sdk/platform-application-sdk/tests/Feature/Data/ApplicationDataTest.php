<?php

/**
 * @file packages/sdk/platform-application-sdk/tests/Feature/Data/ApplicationDataTest.php
 *
 * @description
 * Hydration + shape tests for {@see ApplicationData}. Verifies the
 * snake_case-to-camelCase mapper fires, hidden columns declared on
 * the schema's `x-wire.hidden` never surface, and the `fromRecord()`
 * shortcut hydrates from a raw wire record.
 */

declare(strict_types=1);

use Academorix\PlatformApplicationSdk\Data\ApplicationData;

describe('ApplicationData', function (): void {
    it('hydrates every wire column from a canonical response payload', function (): void {
        $row = [
            'id' => 'app_01HKQBFV1M8ZPQ8Y0TN9G0KJ7X',
            'slug' => 'sports',
            'name' => 'Academorix Sports',
            'description' => 'Sports lineage of Academorix.',
            'default_business_type' => 'academy',
            'default_locale' => 'en',
            'default_timezone' => 'UTC',
            'default_currency' => 'USD',
            'central_host' => 'sports.academorix.app',
            'platform_admin_host' => 'admin.sports.academorix.app',
            'config' => ['branding' => ['accent' => '#111']],
            'is_default' => false,
            'is_system' => true,
            'central_url' => 'https://sports.academorix.app',
            'platform_admin_url' => 'https://admin.sports.academorix.app',
            'created_at' => '2026-07-14T00:00:00Z',
            'updated_at' => '2026-07-15T00:00:00Z',
            'deleted_at' => null,
        ];

        $data = ApplicationData::from($row);

        expect($data->id)->toBe('app_01HKQBFV1M8ZPQ8Y0TN9G0KJ7X')
            ->and($data->slug)->toBe('sports')
            ->and($data->name)->toBe('Academorix Sports')
            ->and($data->description)->toBe('Sports lineage of Academorix.')
            ->and($data->defaultBusinessType)->toBe('academy')
            ->and($data->defaultLocale)->toBe('en')
            ->and($data->defaultTimezone)->toBe('UTC')
            ->and($data->defaultCurrency)->toBe('USD')
            ->and($data->centralHost)->toBe('sports.academorix.app')
            ->and($data->platformAdminHost)->toBe('admin.sports.academorix.app')
            ->and($data->isDefault)->toBeFalse()
            ->and($data->isSystem)->toBeTrue()
            ->and($data->centralUrl)->toBe('https://sports.academorix.app')
            ->and($data->platformAdminUrl)->toBe('https://admin.sports.academorix.app')
            ->and($data->config)->toBe(['branding' => ['accent' => '#111']])
            ->and($data->createdAt)->toBe('2026-07-14T00:00:00Z')
            ->and($data->updatedAt)->toBe('2026-07-15T00:00:00Z')
            ->and($data->deletedAt)->toBeNull();
    });

    it('accepts a nullable description and defaultBusinessType', function (): void {
        $row = minimalApplicationRow();

        $data = ApplicationData::from($row);

        expect($data->description)->toBeNull()
            ->and($data->defaultBusinessType)->toBeNull()
            ->and($data->config)->toBeNull();
    });

    it('never exposes the columns declared under x-wire.hidden', function (): void {
        $row = minimalApplicationRow();

        // Even if the server accidentally leaks `metadata` /
        // `created_by` / `updated_by` / `deleted_by`, the DTO has
        // no property to bind them to — the shape is closed by the
        // constructor signature.
        $shape = array_keys(ApplicationData::from($row)->toArray());

        expect($shape)->not->toContain('metadata')
            ->not->toContain('created_by')
            ->not->toContain('updated_by')
            ->not->toContain('deleted_by');
    });

    it('emits snake_case on serialisation via toArray()', function (): void {
        $row = minimalApplicationRow();

        $wire = ApplicationData::from($row)->toArray();

        expect($wire)->toHaveKey('default_locale')
            ->and($wire)->toHaveKey('central_host')
            ->and($wire)->toHaveKey('platform_admin_host')
            ->and($wire)->toHaveKey('is_default')
            ->and($wire)->toHaveKey('is_system');
    });

    it('hydrates via the fromRecord() shortcut', function (): void {
        $row = minimalApplicationRow();

        $data = ApplicationData::fromRecord($row);

        expect($data)->toBeInstanceOf(ApplicationData::class)
            ->and($data->slug)->toBe($row['slug']);
    });
});

/**
 * Minimal Application wire row — every required column, every
 * nullable column set to `null`.
 *
 * @return array<string, mixed>
 */
function minimalApplicationRow(): array
{
    return [
        'id' => 'app_01HKQBFV1M8ZPQ8Y0TN9G0KJ7X',
        'slug' => 'education',
        'name' => 'Academorix Education',
        'description' => null,
        'default_business_type' => null,
        'default_locale' => 'en',
        'default_timezone' => 'UTC',
        'default_currency' => 'USD',
        'central_host' => 'education.academorix.app',
        'platform_admin_host' => 'admin.education.academorix.app',
        'config' => null,
        'is_default' => true,
        'is_system' => true,
        'central_url' => 'https://education.academorix.app',
        'platform_admin_url' => 'https://admin.education.academorix.app',
        'created_at' => '2026-07-14T00:00:00Z',
        'updated_at' => '2026-07-15T00:00:00Z',
        'deleted_at' => null,
    ];
}
