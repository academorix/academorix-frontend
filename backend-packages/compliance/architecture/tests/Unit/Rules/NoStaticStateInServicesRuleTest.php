<?php

/**
 * @file packages/architecture/tests/Unit/Rules/NoStaticStateInServicesRuleTest.php
 *
 * @description
 * Behaviour tests for
 * {@see \Academorix\Architecture\Rules\NoStaticStateInServicesRule}.
 *
 * The rule forbids writable static properties on classes in the
 * configured `targeted_layers`. Rationale: under Laravel Octane,
 * workers survive across requests — a writable `static $x`
 * hands state from request N to request N+1. `const` and
 * `readonly static` (forward-compat marker) are considered safe
 * because they're immutable at runtime.
 */

declare(strict_types=1);

use Academorix\Architecture\Rules\NoStaticStateInServicesRule;
use Academorix\Architecture\Support\LayerResolver;
use Academorix\Architecture\Support\SourceFileParser;

/**
 * Build the rule + resolver combo, letting each test tune the
 * targeted-layer list without duplicating boilerplate.
 *
 * @param  list<string>  $targetedLayers  LayerType->value strings the
 *                                        rule watches. Defaults mirror
 *                                        the shipped config.
 */
function make_no_static_state_rule(
    array $targetedLayers = ['service', 'action', 'repository', 'controller'],
): NoStaticStateInServicesRule {
    $resolver = new LayerResolver(
        namespaceMap: [
            'service' => ['App\\Services\\'],
            'action' => ['App\\Actions\\'],
            'repository' => ['App\\Repositories\\'],
            'controller' => ['App\\Http\\Controllers\\'],
        ],
        modelBaseClasses: [],
        controllerBaseClasses: [],
        testPathPrefixes: [],
        infraPathPrefixes: [],
    );

    return new NoStaticStateInServicesRule($resolver, [
        'severity' => 'error',
        'targeted_layers' => $targetedLayers,
    ]);
}

it('fires on a writable static property inside a Service', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Services;

    final class CachedInvoiceService
    {
        public static array $items = [];
    }
    PHP;

    $file = (new SourceFileParser())->parseSource(
        '/src/App/Services/CachedInvoiceService.php',
        $source,
    );
    $violations = make_no_static_state_rule()->check($file);

    expect($violations)->toHaveCount(1)
        ->and($violations[0]->offender)->toBe('$items')
        ->and($violations[0]->ruleId)->toBe('architecture.no_static_state_in_services');
});

it('does not fire on a readonly static property (forward-compat)', function (): void {
    // `readonly static` isn't yet legal PHP but the parser and
    // rule treat it as safe for the day PHP allows it. The regex
    // parser doesn't care whether the source would compile.
    $source = <<<'PHP'
    <?php
    namespace App\Services;

    final class SafeService
    {
        public static readonly array $items = [];
    }
    PHP;

    $file = (new SourceFileParser())->parseSource(
        '/src/App/Services/SafeService.php',
        $source,
    );
    $violations = make_no_static_state_rule()->check($file);

    expect($violations)->toBe([]);
});

it('does not fire on const declarations', function (): void {
    // Consts are compile-time immutable — no cross-request
    // contamination risk. The property parser only matches
    // declarations that carry a `$` sigil so `const` never
    // shows up in `$file->properties` at all.
    $source = <<<'PHP'
    <?php
    namespace App\Services;

    final class ConstService
    {
        public const int MAX = 5;
        public const array DEFAULTS = ['a', 'b'];
    }
    PHP;

    $file = (new SourceFileParser())->parseSource(
        '/src/App/Services/ConstService.php',
        $source,
    );
    $violations = make_no_static_state_rule()->check($file);

    expect($violations)->toBe([]);
});

it('does not fire in Controllers when only Service and Action are targeted', function (): void {
    // Config narrows the rule to services + actions. Even though
    // the file has an obvious violation, controllers aren't in
    // the target list — no diagnostics emit.
    $source = <<<'PHP'
    <?php
    namespace App\Http\Controllers;

    final class UserController
    {
        public static array $counters = [];
    }
    PHP;

    $file = (new SourceFileParser())->parseSource(
        '/src/App/Http/Controllers/UserController.php',
        $source,
    );
    $violations = make_no_static_state_rule(targetedLayers: ['service', 'action'])->check($file);

    expect($violations)->toBe([]);
});
