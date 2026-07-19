<?php

/**
 * @file modules/platform/application/tests/Feature/Actions/Applications/ListApplicationsTest.php
 *
 * @description
 * Feature coverage for the public-facing `GET /api/v1/applications`
 * endpoint. Hits the router; asserts on the JSON envelope + observable
 * side effects.
 */

declare(strict_types=1);

use Academorix\Application\Models\Application;

it('lists every enabled Application', function (): void {
    Application::factory()->count(3)->create();

    $response = $this->getJson('/api/v1/applications');

    $response->assertOk()
        ->assertJsonCount(3, 'data')
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'slug', 'name', 'central_host', 'platform_admin_host'],
            ],
        ]);
});

it('excludes soft-deleted Applications from the public list', function (): void {
    Application::factory()->create(['slug' => 'active']);
    $archived = Application::factory()->create(['slug' => 'archived']);
    $archived->delete();

    $response = $this->getJson('/api/v1/applications');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonFragment(['slug' => 'active']);
});

it('resolves the default row on empty catalogue lookups', function (): void {
    Application::factory()->academorix()->create();

    $response = $this->getJson('/api/v1/applications');

    $response->assertOk()
        ->assertJsonFragment(['slug' => 'academorix', 'is_default' => true]);
});
