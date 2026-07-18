<?php

/**
 * @file packages/architecture/tests/Unit/Rules/NoDirectModelAccessRuleTest.php
 *
 * @description
 * Behaviour tests for
 * {@see \Academorix\Architecture\Rules\NoDirectModelAccessRule}.
 *
 * The headline layering rule: Models may only be referenced from
 * Repositories, other Models, Tests, Infrastructure, or classes
 * explicitly marked `#[AllowsDirectModelAccess]`. Every other
 * layer that touches `App\Models\*` produces a violation.
 *
 * Layer classification is performed by the shared
 * {@see \Academorix\Architecture\Support\LayerResolver} — each
 * test builds a resolver primed with realistic defaults, then
 * pushes the fixture SourceFile through the rule.
 */

declare(strict_types=1);

use Academorix\Architecture\Rules\NoDirectModelAccessRule;
use Academorix\Architecture\Support\LayerResolver;
use Academorix\Architecture\Support\SourceFileParser;

/**
 * Shared factory — mirrors the shipped defaults so tests reason
 * about the same layer signals operators do.
 *
 * @param  list<string>  $testPathPrefixes  Optional test-root
 *                                          override for the
 *                                          "Test layer skips
 *                                          the check" branch.
 */
function make_no_direct_model_access_rule(array $testPathPrefixes = []): NoDirectModelAccessRule
{
    $resolver = new LayerResolver(
        namespaceMap: [
            'model' => ['App\\Models\\'],
            'repository' => ['App\\Repositories\\'],
            'service' => ['App\\Services\\'],
            'action' => ['App\\Actions\\'],
            'controller' => ['App\\Http\\Controllers\\'],
            'infrastructure' => ['App\\Providers\\'],
        ],
        modelBaseClasses: ['Model', 'Authenticatable'],
        controllerBaseClasses: ['Controller', 'BaseController'],
        testPathPrefixes: $testPathPrefixes,
        infraPathPrefixes: [],
    );

    return new NoDirectModelAccessRule($resolver, [
        'severity' => 'error',
        'model_namespaces' => ['App\\Models\\'],
        'allowlist_paths' => [],
    ]);
}

it('fires when a Controller imports a Model', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Http\Controllers;

    use App\Models\User;

    final class UserController
    {
        public function show(User $user): mixed { return $user; }
    }
    PHP;

    $file = (new SourceFileParser())->parseSource(
        '/src/App/Http/Controllers/UserController.php',
        $source,
    );
    $violations = make_no_direct_model_access_rule()->check($file);

    expect($violations)->toHaveCount(1)
        ->and($violations[0]->offender)->toBe('App\\Models\\User')
        ->and($violations[0]->ruleId)->toBe('architecture.no_direct_model_access');
});

it('fires when a Service imports a Model via a use statement', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Services;

    use App\Models\Invoice;

    final class InvoiceService
    {
        public function tally(Invoice $invoice): int { return 0; }
    }
    PHP;

    $file = (new SourceFileParser())->parseSource(
        '/src/App/Services/InvoiceService.php',
        $source,
    );
    $violations = make_no_direct_model_access_rule()->check($file);

    expect($violations)->toHaveCount(1)
        ->and($violations[0]->offender)->toBe('App\\Models\\Invoice');
});

it('fires on an inline FQCN reference to a Model', function (): void {
    // No `use` statement — the reference is purely inline. This
    // isolates the inline-reference branch of the rule from the
    // use-statement branch.
    $source = <<<'PHP'
    <?php
    namespace App\Http\Controllers;

    final class UserController
    {
        public function index(): mixed
        {
            return \App\Models\User::query()->get();
        }
    }
    PHP;

    $file = (new SourceFileParser())->parseSource(
        '/src/App/Http/Controllers/UserController.php',
        $source,
    );
    $violations = make_no_direct_model_access_rule()->check($file);

    expect($violations)->toHaveCount(1)
        ->and($violations[0]->offender)->toBe('App\\Models\\User');
});

it('does not fire when a Repository imports the same Model', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Repositories;

    use App\Models\Invoice;

    final class InvoiceRepository
    {
        public function find(int $id): ?Invoice { return null; }
    }
    PHP;

    $file = (new SourceFileParser())->parseSource(
        '/src/App/Repositories/InvoiceRepository.php',
        $source,
    );
    $violations = make_no_direct_model_access_rule()->check($file);

    expect($violations)->toBe([]);
});

it('does not fire when the class carries #[AllowsDirectModelAccess]', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Http\Controllers;

    use App\Models\User;

    #[AllowsDirectModelAccess(reason: 'Legacy DBA report — remove after billing v2.')]
    final class LegacyReportController
    {
        public function run(User $user): mixed { return $user; }
    }
    PHP;

    $file = (new SourceFileParser())->parseSource(
        '/src/App/Http/Controllers/LegacyReportController.php',
        $source,
    );
    $violations = make_no_direct_model_access_rule()->check($file);

    expect($violations)->toBe([]);
});

it('does not fire on Test-layer files', function (): void {
    // Even though the file "looks like" a Service (imports a
    // Model, no attribute), its path lives under a configured
    // test root — the resolver reports LayerType::Test which the
    // rule's allowlist accepts.
    $source = <<<'PHP'
    <?php
    namespace Tests\Feature;

    use App\Models\User;

    final class UserApiTest
    {
        public function test_show(): void {}
    }
    PHP;

    $file = (new SourceFileParser())->parseSource(
        '/repo/tests/Feature/UserApiTest.php',
        $source,
    );
    $violations = make_no_direct_model_access_rule(testPathPrefixes: ['/repo/tests'])->check($file);

    expect($violations)->toBe([]);
});
