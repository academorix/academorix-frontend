<?php

/**
 * @file packages/architecture/tests/Unit/LayerResolverTest.php
 *
 * @description
 * Behaviour tests for {@see \Academorix\Architecture\Support\LayerResolver}.
 *
 * The resolver classifies each parsed source file into exactly one
 * {@see \Academorix\Architecture\Enums\LayerType}. Its priority
 * order is documented on the class:
 *
 *   1. Configured test / infrastructure path prefixes.
 *   2. Class attributes (`#[Domain]`, `#[Repository]`, ...).
 *   3. Marker interfaces (implemented interface short names).
 *   4. Base-class inheritance (`extends Model` / `extends Controller`).
 *   5. Namespace-prefix convention.
 *   6. Fallback: `LayerType::Unknown`.
 *
 * Each `it()` block exercises one signal in isolation so an
 * accidental reordering shows up as a targeted failure.
 */

declare(strict_types=1);

use Academorix\Architecture\Enums\LayerType;
use Academorix\Architecture\Support\LayerResolver;
use Academorix\Architecture\Support\SourceFileParser;

/**
 * Build a resolver preloaded with the same defaults the shipped
 * config file uses. Keeps every test focused on the SIGNAL under
 * test rather than repeating configuration boilerplate.
 *
 * @param  list<string>  $testPathPrefixes   Optional override — some tests
 *                                           need a specific test root.
 * @param  list<string>  $infraPathPrefixes  Optional override — some tests
 *                                           need a specific infra root.
 */
function make_resolver(
    array $testPathPrefixes = [],
    array $infraPathPrefixes = [],
): LayerResolver {
    return new LayerResolver(
        namespaceMap: [
            'model' => ['App\\Models\\'],
            'repository' => ['App\\Repositories\\'],
            'service' => ['App\\Services\\'],
            'action' => ['App\\Actions\\'],
            'controller' => ['App\\Http\\Controllers\\'],
            'infrastructure' => [
                'App\\Providers\\',
                'App\\Http\\Middleware\\',
                'App\\Console\\',
            ],
        ],
        modelBaseClasses: ['Model', 'Authenticatable', 'Pivot', 'MorphPivot'],
        controllerBaseClasses: ['Controller', 'BaseController'],
        testPathPrefixes: $testPathPrefixes,
        infraPathPrefixes: $infraPathPrefixes,
    );
}

// -----------------------------------------------------------------
// Base-class signals — resolver priority #4.
// -----------------------------------------------------------------

it('resolves the Model layer from extends Model', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Domain;

    class Post extends Model {}
    PHP;

    $file = (new SourceFileParser())->parseSource('/src/App/Domain/Post.php', $source);
    $layer = make_resolver()->resolve($file);

    expect($layer)->toBe(LayerType::Model);
});

it('resolves the Model layer from extends Authenticatable', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Domain;

    class Admin extends Authenticatable {}
    PHP;

    $file = (new SourceFileParser())->parseSource('/src/App/Domain/Admin.php', $source);
    $layer = make_resolver()->resolve($file);

    expect($layer)->toBe(LayerType::Model);
});

it('resolves the Controller layer from extends BaseController', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Api;

    final class UserApi extends BaseController {}
    PHP;

    $file = (new SourceFileParser())->parseSource('/src/App/Api/UserApi.php', $source);
    $layer = make_resolver()->resolve($file);

    expect($layer)->toBe(LayerType::Controller);
});

// -----------------------------------------------------------------
// Attribute signals — resolver priority #2.
// -----------------------------------------------------------------

it('resolves the Model layer from a #[Domain] attribute', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Domain;

    #[Domain]
    class Invoice {}
    PHP;

    $file = (new SourceFileParser())->parseSource('/src/App/Domain/Invoice.php', $source);
    $layer = make_resolver()->resolve($file);

    expect($layer)->toBe(LayerType::Model);
});

it('resolves the Repository layer from a #[Repository] attribute', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Something;

    #[Repository]
    final class InvoiceRepository {}
    PHP;

    $file = (new SourceFileParser())->parseSource('/src/App/Something/InvoiceRepository.php', $source);
    $layer = make_resolver()->resolve($file);

    expect($layer)->toBe(LayerType::Repository);
});

// -----------------------------------------------------------------
// Namespace-convention signals — resolver priority #5.
// -----------------------------------------------------------------

it('resolves the Service layer from the App\\Services\\ namespace prefix', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Services;

    final class InvoiceService {}
    PHP;

    $file = (new SourceFileParser())->parseSource('/src/App/Services/InvoiceService.php', $source);
    $layer = make_resolver()->resolve($file);

    expect($layer)->toBe(LayerType::Service);
});

// -----------------------------------------------------------------
// Path-prefix signals — resolver priority #1.
// -----------------------------------------------------------------

it('resolves the Test layer from a configured test-path prefix', function (): void {
    // Even though the source declares a controller-shaped
    // extension, the path-prefix signal fires FIRST and wins.
    $source = <<<'PHP'
    <?php
    namespace Tests\Feature;

    class UserApiTest {}
    PHP;

    $file = (new SourceFileParser())->parseSource('/repo/tests/Feature/UserApiTest.php', $source);
    $layer = make_resolver(testPathPrefixes: ['/repo/tests'])->resolve($file);

    expect($layer)->toBe(LayerType::Test);
});

it('resolves the Infrastructure layer from a configured infra-path prefix', function (): void {
    $source = <<<'PHP'
    <?php
    // Migrations live under /database/migrations and don't declare
    // a namespace — this mirrors real Laravel migrations.

    return new class {};
    PHP;

    $file = (new SourceFileParser())->parseSource(
        '/repo/database/migrations/2024_01_01_create_users.php',
        $source,
    );
    $layer = make_resolver(infraPathPrefixes: ['/repo/database'])->resolve($file);

    expect($layer)->toBe(LayerType::Infrastructure);
});

// -----------------------------------------------------------------
// Fallback + priority-ordering guarantees.
// -----------------------------------------------------------------

it('returns Unknown when no signal fires', function (): void {
    $source = <<<'PHP'
    <?php
    namespace Company\Utilities;

    final class Timer {}
    PHP;

    $file = (new SourceFileParser())->parseSource('/repo/src/Company/Utilities/Timer.php', $source);
    $layer = make_resolver()->resolve($file);

    expect($layer)->toBe(LayerType::Unknown);
});

it('lets attribute detection win over namespace convention', function (): void {
    // The namespace says "Service" but the attribute says
    // "Repository" — attributes are checked BEFORE the namespace
    // map, so the attribute wins.
    $source = <<<'PHP'
    <?php
    namespace App\Services;

    #[Repository]
    final class SneakyRepository {}
    PHP;

    $file = (new SourceFileParser())->parseSource(
        '/src/App/Services/SneakyRepository.php',
        $source,
    );
    $layer = make_resolver()->resolve($file);

    expect($layer)->toBe(LayerType::Repository);
});
