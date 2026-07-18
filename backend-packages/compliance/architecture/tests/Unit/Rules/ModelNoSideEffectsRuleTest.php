<?php

/**
 * @file packages/architecture/tests/Unit/Rules/ModelNoSideEffectsRuleTest.php
 *
 * @description
 * Behaviour tests for
 * {@see \Academorix\Architecture\Rules\ModelNoSideEffectsRule}.
 *
 * Fat models are the classic anti-pattern this rule targets:
 * business actions like `$user->send()` are indistinguishable
 * from data accessors at the call site. The rule flags every
 * PUBLIC method on a Model whose name appears in the configured
 * `forbidden_method_names` list. Non-Model layers pass through
 * untouched.
 */

declare(strict_types=1);

use Academorix\Architecture\Rules\ModelNoSideEffectsRule;
use Academorix\Architecture\Support\LayerResolver;
use Academorix\Architecture\Support\SourceFileParser;

/**
 * Shared factory — the resolver is primed with the canonical
 * Model base classes and namespace prefixes so the fixtures
 * classify predictably.
 */
function make_model_no_side_effects_rule(): ModelNoSideEffectsRule
{
    $resolver = new LayerResolver(
        namespaceMap: [
            'model' => ['App\\Models\\'],
            'service' => ['App\\Services\\'],
        ],
        modelBaseClasses: ['Model', 'Authenticatable'],
        controllerBaseClasses: [],
        testPathPrefixes: [],
        infraPathPrefixes: [],
    );

    return new ModelNoSideEffectsRule($resolver, [
        'severity' => 'warning',
        'forbidden_method_names' => [
            'send', 'notify', 'process', 'charge',
            'refund', 'dispatch', 'execute', 'handle',
        ],
    ]);
}

it('fires on a public function send() declared inside a Model', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Models;

    class Invoice extends Model
    {
        public function send(): void
        {
            // Any side-effecting body — doesn't matter, the rule
            // matches on the method name alone.
        }
    }
    PHP;

    $file = (new SourceFileParser())->parseSource('/src/App/Models/Invoice.php', $source);
    $violations = make_model_no_side_effects_rule()->check($file);

    expect($violations)->toHaveCount(1)
        ->and($violations[0]->offender)->toBe('send()')
        ->and($violations[0]->ruleId)->toBe('architecture.model_no_side_effects');
});

it('does not fire on Eloquent-style scope methods', function (): void {
    // `scopeActive` is a query scope, not a side effect. It's not
    // in the forbidden-method-names list so the rule passes even
    // though the file lives on a Model.
    $source = <<<'PHP'
    <?php
    namespace App\Models;

    class Invoice extends Model
    {
        public function scopeActive($query): mixed
        {
            return $query;
        }
    }
    PHP;

    $file = (new SourceFileParser())->parseSource('/src/App/Models/Invoice.php', $source);
    $violations = make_model_no_side_effects_rule()->check($file);

    expect($violations)->toBe([]);
});

it('does not fire on files in the Service layer', function (): void {
    // Services LEGITIMATELY expose methods called `send`,
    // `dispatch`, etc. — that's the point of a service. The rule
    // is scoped exclusively to Models via LayerResolver.
    $source = <<<'PHP'
    <?php
    namespace App\Services;

    final class NotificationService
    {
        public function send(): void {}
    }
    PHP;

    $file = (new SourceFileParser())->parseSource(
        '/src/App/Services/NotificationService.php',
        $source,
    );
    $violations = make_model_no_side_effects_rule()->check($file);

    expect($violations)->toBe([]);
});
