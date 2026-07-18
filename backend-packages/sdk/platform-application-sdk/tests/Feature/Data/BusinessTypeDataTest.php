<?php

/**
 * @file packages/sdk/platform-application-sdk/tests/Feature/Data/BusinessTypeDataTest.php
 *
 * @description
 * Hydration + shape tests for {@see BusinessTypeData}. Verifies
 * snake_case bridge, optional-field defaults, and translation
 * inclusion behaviour.
 */

declare(strict_types=1);

use Academorix\PlatformApplicationSdk\Data\BusinessTypeData;

describe('BusinessTypeData', function (): void {
    it('hydrates the full catalogue entry with defaults', function (): void {
        $row = [
            'key' => 'academy',
            'label' => 'Academy',
            'description' => 'Education-first sports academy.',
            'default_config' => [
                'features' => ['athletes', 'teams', 'attendance'],
                'terminology' => ['athletes' => 'Students'],
                'roles' => ['owner', 'coach'],
                'entitlements' => [
                    'athletes.max' => ['kind' => 'slot', 'limit' => 500],
                ],
                'onboarding_steps' => ['create_branch', 'invite_coach'],
                'sports' => ['football', 'basketball'],
            ],
            'icon' => 'academic-cap',
            'hero_image_url' => 'https://cdn.academorix.app/academy.jpg',
            'priority' => 10,
            'is_visible' => true,
        ];

        $data = BusinessTypeData::from($row);

        expect($data->key)->toBe('academy')
            ->and($data->label)->toBe('Academy')
            ->and($data->description)->toBe('Education-first sports academy.')
            ->and($data->defaultConfig)->toBe($row['default_config'])
            ->and($data->icon)->toBe('academic-cap')
            ->and($data->heroImageUrl)->toBe('https://cdn.academorix.app/academy.jpg')
            ->and($data->priority)->toBe(10)
            ->and($data->isVisible)->toBeTrue()
            ->and($data->translations)->toBeNull()
            ->and($data->labelTranslations)->toBeNull();
    });

    it('accepts a minimal payload with only the required fields', function (): void {
        $row = [
            'key' => 'gym',
            'label' => 'Gym',
            'description' => 'Fitness center.',
            'default_config' => [],
        ];

        $data = BusinessTypeData::from($row);

        expect($data->icon)->toBeNull()
            ->and($data->heroImageUrl)->toBeNull()
            ->and($data->priority)->toBeNull()
            ->and($data->isVisible)->toBeNull();
    });

    it('surfaces the translations map when the server included it', function (): void {
        $row = [
            'key' => 'school',
            'label' => 'School',
            'description' => 'K-12 school.',
            'default_config' => [],
            'translations' => [
                'en' => ['label' => 'School', 'description' => 'K-12 school.'],
                'fr' => ['label' => 'École', 'description' => 'École primaire et secondaire.'],
            ],
        ];

        $data = BusinessTypeData::from($row);

        expect($data->translations)->toBe($row['translations'])
            ->and($data->translations['fr']['label'])->toBe('École');
    });

    it('emits snake_case on serialisation via toArray()', function (): void {
        $row = [
            'key' => 'club',
            'label' => 'Club',
            'description' => 'Membership-driven club.',
            'default_config' => [],
            'hero_image_url' => null,
            'is_visible' => true,
        ];

        $wire = BusinessTypeData::from($row)->toArray();

        expect($wire)->toHaveKey('default_config')
            ->and($wire)->toHaveKey('hero_image_url')
            ->and($wire)->toHaveKey('is_visible');
    });

    it('hydrates via the fromRecord() shortcut', function (): void {
        $row = [
            'key' => 'federation',
            'label' => 'Federation',
            'description' => 'Regional federation.',
            'default_config' => [],
        ];

        expect(BusinessTypeData::fromRecord($row)->key)->toBe('federation');
    });
});
