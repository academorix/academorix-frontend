<?php

/**
 * @file packages/architecture/tests/Unit/Rules/NoFormRequestRuleTest.php
 *
 * @description
 * Behaviour tests for
 * {@see \Academorix\Architecture\Rules\NoFormRequestRule}.
 *
 * The rule bans Laravel's `FormRequest`. It fires on:
 *
 *   1. A `use Illuminate\Foundation\Http\FormRequest;` import.
 *   2. A `class Foo extends FormRequest` inheritance (short name
 *      resolved via the file's imports).
 *
 * Both trigger independently — a file that does both produces
 * TWO violations. Files with unrelated imports produce zero.
 *
 * Every test builds the rule fresh with the shipping config
 * shape so we stay honest about the surface area operators
 * actually touch.
 */

declare(strict_types=1);

use Academorix\Architecture\Rules\NoFormRequestRule;
use Academorix\Architecture\Support\LayerResolver;
use Academorix\Architecture\Support\SourceFileParser;
use Academorix\Architecture\Violations\Severity;

/**
 * Build a fresh rule with the shipped config defaults. The
 * layer resolver is only referenced when the rule wants to
 * classify a file — the FormRequest ban is codebase-wide, so
 * an empty-configured resolver is fine.
 */
function make_no_form_request_rule(): NoFormRequestRule
{
    $resolver = new LayerResolver(
        namespaceMap: [],
        modelBaseClasses: [],
        controllerBaseClasses: [],
        testPathPrefixes: [],
        infraPathPrefixes: [],
    );

    return new NoFormRequestRule($resolver, [
        'severity' => 'error',
        'forbidden_bases' => [
            'Illuminate\\Foundation\\Http\\FormRequest',
        ],
    ]);
}

it('fires on a direct FormRequest import', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Http\Requests;

    use Illuminate\Foundation\Http\FormRequest;

    // Class doesn't need to extend FormRequest for the import to
    // be a violation on its own — this test isolates the import
    // branch.
    final class LegacyRequest
    {
    }
    PHP;

    $file = (new SourceFileParser())->parseSource('/src/App/Http/Requests/LegacyRequest.php', $source);
    $violations = make_no_form_request_rule()->check($file);

    expect($violations)->toHaveCount(1)
        ->and($violations[0]->offender)->toBe('Illuminate\\Foundation\\Http\\FormRequest');
});

it('fires when a class extends FormRequest via its imported short name', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Http\Requests;

    use Illuminate\Foundation\Http\FormRequest;

    final class LoginRequest extends FormRequest
    {
    }
    PHP;

    $file = (new SourceFileParser())->parseSource('/src/App/Http/Requests/LoginRequest.php', $source);
    $violations = make_no_form_request_rule()->check($file);

    // Two violations — one for the import, one for the extends
    // clause. See the dedicated "both" test for the assertion on
    // the shape of each.
    expect($violations)->toHaveCount(2);
});

it('emits two separate violations when a file both imports and extends FormRequest', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Http\Requests;

    use Illuminate\Foundation\Http\FormRequest;

    final class UpdateRequest extends FormRequest
    {
    }
    PHP;

    $file = (new SourceFileParser())->parseSource('/src/App/Http/Requests/UpdateRequest.php', $source);
    $violations = make_no_form_request_rule()->check($file);

    expect($violations)->toHaveCount(2);

    // Every violation flags the FormRequest FQCN regardless of
    // whether it originated from the import or the extends clause.
    foreach ($violations as $violation) {
        expect($violation->offender)->toBe('Illuminate\\Foundation\\Http\\FormRequest');
    }
});

it('does not fire on unrelated imports', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Data;

    use Spatie\LaravelData\Data;

    final class LoginData extends Data
    {
    }
    PHP;

    $file = (new SourceFileParser())->parseSource('/src/App/Data/LoginData.php', $source);
    $violations = make_no_form_request_rule()->check($file);

    expect($violations)->toBe([]);
});

it('exposes id() = "architecture.no_form_request" and Error severity on emitted violations', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Http\Requests;

    use Illuminate\Foundation\Http\FormRequest;
    PHP;

    $rule = make_no_form_request_rule();

    // The dotted id is public API — reporter output, config keys,
    // grep-ability all depend on it.
    expect($rule->id())->toBe('architecture.no_form_request');

    // Trigger one violation to inspect the emitted severity — the
    // rule's `severity()` method is protected, so we exercise it
    // through the public path.
    $file = (new SourceFileParser())->parseSource(
        '/src/App/Http/Requests/Legacy.php',
        $source,
    );
    $violations = $rule->check($file);

    expect($violations)->toHaveCount(1)
        ->and($violations[0]->severity)->toBe(Severity::Error)
        ->and($violations[0]->ruleId)->toBe('architecture.no_form_request');
});
