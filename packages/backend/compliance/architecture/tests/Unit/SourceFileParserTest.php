<?php

/**
 * @file packages/architecture/tests/Unit/SourceFileParserTest.php
 *
 * @description
 * Behaviour tests for {@see \Academorix\Architecture\Support\SourceFileParser}.
 *
 * The parser is regex-driven and covers a specific subset of the
 * PHP grammar (see the class docblock for the full contract). This
 * suite exercises every feature the parser advertises, plus the
 * `SourceFile` value-object helpers that downstream rules depend
 * on. Each `it()` block owns exactly one behaviour so a regression
 * shows up as a single failing test instead of a bulk-failure
 * cascade.
 *
 * ## Conventions
 *
 *   - Fixtures live in-line as `<<<'PHP'` heredocs. Storing them
 *     next to the test keeps the "what am I parsing?" and "what
 *     do I expect?" side by side.
 *   - All parser calls go through `parseSource('/fake/path.php',
 *     $source)` — the fake path is stored on the resulting value
 *     object but never touched by the parser itself, so tests
 *     don't need real files on disk.
 */

declare(strict_types=1);

use Academorix\Architecture\Support\MethodDeclaration;
use Academorix\Architecture\Support\PropertyDeclaration;
use Academorix\Architecture\Support\SourceFile;
use Academorix\Architecture\Support\SourceFileParser;
use Academorix\Architecture\Support\UseStatement;

// -----------------------------------------------------------------
// Namespace + class declaration.
// -----------------------------------------------------------------

it('parses the namespace declaration', function (): void {
    $source = <<<'PHP'
    <?php
    declare(strict_types=1);
    namespace App\Http\Controllers;

    final class UserController {}
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    expect($file)->toBeInstanceOf(SourceFile::class)
        ->and($file->namespace)->toBe('App\\Http\\Controllers')
        ->and($file->classFqcn)->toBe('App\\Http\\Controllers\\UserController');
});

it('parses a class declaration', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Models;

    class User {}
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    expect($file->classKeyword)->toBe('class')
        ->and($file->className)->toBe('User');
});

it('parses an interface declaration', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Contracts;

    interface UserRepository {}
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    expect($file->classKeyword)->toBe('interface')
        ->and($file->className)->toBe('UserRepository');
});

it('parses a trait declaration', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Support;

    trait HasTimestamps {}
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    expect($file->classKeyword)->toBe('trait')
        ->and($file->className)->toBe('HasTimestamps');
});

it('parses an enum declaration', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Enums;

    enum Status: string
    {
        case Active = 'active';
    }
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    expect($file->classKeyword)->toBe('enum')
        ->and($file->className)->toBe('Status');
});

// -----------------------------------------------------------------
// Class modifiers — final, abstract, readonly (individually + combined).
// -----------------------------------------------------------------

it('captures the final class modifier', function (): void {
    $source = <<<'PHP'
    <?php
    final class Foo {}
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    expect($file->classModifiers)->toBe(['final'])
        ->and($file->hasClassModifier('final'))->toBeTrue();
});

it('captures the abstract class modifier', function (): void {
    $source = <<<'PHP'
    <?php
    abstract class Foo {}
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    expect($file->classModifiers)->toBe(['abstract'])
        ->and($file->hasClassModifier('abstract'))->toBeTrue();
});

it('captures the readonly class modifier', function (): void {
    $source = <<<'PHP'
    <?php
    readonly class Foo {}
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    expect($file->classModifiers)->toBe(['readonly'])
        ->and($file->hasClassModifier('readonly'))->toBeTrue();
});

it('captures combined final + readonly modifiers', function (): void {
    $source = <<<'PHP'
    <?php
    final readonly class Foo {}
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    // Modifiers should be preserved in source order — the parser's
    // contract is "captured verbatim in the order they appeared".
    expect($file->classModifiers)->toBe(['final', 'readonly'])
        ->and($file->hasClassModifier('final'))->toBeTrue()
        ->and($file->hasClassModifier('readonly'))->toBeTrue();
});

// -----------------------------------------------------------------
// extends / implements clauses.
// -----------------------------------------------------------------

it('captures the extends clause', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Models;

    class Post extends Model {}
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    expect($file->extends)->toBe('Model');
});

it('captures an implements clause with multiple interfaces', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Jobs;

    final class SendInvoice implements ShouldQueue, ShouldBeUnique
    {
    }
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    expect($file->implements)->toBe(['ShouldQueue', 'ShouldBeUnique']);
});

// -----------------------------------------------------------------
// Class-level attributes.
// -----------------------------------------------------------------

it('captures a simple class attribute', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Models;

    #[Domain]
    class User {}
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    expect($file->classAttributes)->toContain('Domain');
});

it('captures an attribute that carries arguments', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Domain;

    #[Repository(model: User::class, cache: true)]
    class UserRepository {}
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    // Argument list is stripped — the parser stores just the
    // attribute name so rule matching is straightforward.
    expect($file->classAttributes)->toContain('Repository');
});

it('captures multiple attributes declared in one group', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Domain;

    #[Domain, Repository]
    class UserRepository {}
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    expect($file->classAttributes)->toContain('Domain')
        ->and($file->classAttributes)->toContain('Repository');
});

// -----------------------------------------------------------------
// use statements — simple, aliased, function/const, grouped.
// -----------------------------------------------------------------

it('captures a simple use statement', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Http\Controllers;

    use App\Models\User;

    final class UserController {}
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    expect($file->useStatements)->toHaveCount(1);

    $use = $file->useStatements[0];
    expect($use)->toBeInstanceOf(UseStatement::class)
        ->and($use->fqcn)->toBe('App\\Models\\User')
        ->and($use->alias)->toBeNull()
        ->and($use->kind)->toBe(UseStatement::KIND_CLASS)
        ->and($use->localName())->toBe('User');
});

it('captures an aliased use statement', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Http\Controllers;

    use App\Models\User as UserModel;

    final class UserController {}
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    expect($file->useStatements)->toHaveCount(1);

    $use = $file->useStatements[0];
    expect($use->fqcn)->toBe('App\\Models\\User')
        ->and($use->alias)->toBe('UserModel')
        ->and($use->localName())->toBe('UserModel');
});

it('captures a function import', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Support;

    use function App\Helpers\format_date;
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    expect($file->useStatements)->toHaveCount(1)
        ->and($file->useStatements[0]->kind)->toBe(UseStatement::KIND_FUNCTION)
        ->and($file->useStatements[0]->fqcn)->toBe('App\\Helpers\\format_date');
});

it('captures a const import', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Support;

    use const App\Constants\BAR;
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    expect($file->useStatements)->toHaveCount(1)
        ->and($file->useStatements[0]->kind)->toBe(UseStatement::KIND_CONST)
        ->and($file->useStatements[0]->fqcn)->toBe('App\\Constants\\BAR');
});

it('expands a grouped use statement', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Http\Controllers;

    use App\Models\{User, Invoice, Payment as PaymentModel};
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    // Grouped imports are expanded — one UseStatement per member.
    expect($file->useStatements)->toHaveCount(3);

    // Assertions collect the FQCNs so ordering of the underlying
    // preg passes doesn't matter — only content does.
    $fqcns = array_map(fn (UseStatement $use): string => $use->fqcn, $file->useStatements);
    expect($fqcns)->toContain('App\\Models\\User')
        ->and($fqcns)->toContain('App\\Models\\Invoice')
        ->and($fqcns)->toContain('App\\Models\\Payment');

    // Locate the aliased member and confirm the alias survived.
    $paymentUse = null;
    foreach ($file->useStatements as $use) {
        if ($use->fqcn === 'App\\Models\\Payment') {
            $paymentUse = $use;
            break;
        }
    }
    expect($paymentUse)->not->toBeNull()
        ->and($paymentUse?->alias)->toBe('PaymentModel');
});

// -----------------------------------------------------------------
// Inline FQCN references.
// -----------------------------------------------------------------

it('captures inline FQCN references in method bodies', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Http\Controllers;

    final class UserController
    {
        public function show(int $id): mixed
        {
            return \App\Models\User::query()->find($id);
        }
    }
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    $fqcns = array_map(fn ($ref) => $ref->fqcn, $file->inlineReferences);
    expect($fqcns)->toContain('App\\Models\\User');
});

// -----------------------------------------------------------------
// Property extraction.
// -----------------------------------------------------------------

it('extracts class-body properties with correct visibility and flags', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Services;

    final class Cache
    {
        public static array $items = [];
        protected readonly string $prefix = 'x';
        private int $count = 0;
    }
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    // Filter to class-body properties only (isPromoted = false).
    $classProps = array_values(array_filter(
        $file->properties,
        fn (PropertyDeclaration $p): bool => ! $p->isPromoted,
    ));

    expect($classProps)->toHaveCount(3);

    // Index the properties by name for stable lookup regardless of
    // capture order.
    $byName = [];
    foreach ($classProps as $prop) {
        $byName[$prop->name] = $prop;
    }

    expect($byName['items']->visibility)->toBe('public')
        ->and($byName['items']->isStatic)->toBeTrue()
        ->and($byName['items']->isReadonly)->toBeFalse();

    expect($byName['prefix']->visibility)->toBe('protected')
        ->and($byName['prefix']->isStatic)->toBeFalse()
        ->and($byName['prefix']->isReadonly)->toBeTrue();

    expect($byName['count']->visibility)->toBe('private')
        ->and($byName['count']->isStatic)->toBeFalse()
        ->and($byName['count']->isReadonly)->toBeFalse();
});

it('extracts constructor promoted properties with isPromoted = true', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Services;

    final class Sender
    {
        public function __construct(
            public readonly string $host,
            private int $timeout,
        ) {}
    }
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    // Isolate the promoted properties for stable assertions.
    $promoted = array_values(array_filter(
        $file->properties,
        fn (PropertyDeclaration $p): bool => $p->isPromoted,
    ));
    expect($promoted)->toHaveCount(2);

    $byName = [];
    foreach ($promoted as $prop) {
        $byName[$prop->name] = $prop;
    }

    expect($byName['host']->visibility)->toBe('public')
        ->and($byName['host']->isReadonly)->toBeTrue()
        ->and($byName['host']->isPromoted)->toBeTrue()
        ->and($byName['host']->isStatic)->toBeFalse();

    expect($byName['timeout']->visibility)->toBe('private')
        ->and($byName['timeout']->isReadonly)->toBeFalse()
        ->and($byName['timeout']->isPromoted)->toBeTrue();
});

// -----------------------------------------------------------------
// Method extraction.
// -----------------------------------------------------------------

it('extracts method declarations with correct visibility and flags', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Services;

    abstract class Base
    {
        final public function handle(): void {}
        protected static function make(): static {}
        abstract private function internal(): void;
    }
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    // Index methods by name for stable assertions.
    $byName = [];
    foreach ($file->methods as $method) {
        $byName[$method->name] = $method;
    }

    expect($file->methods)->toHaveCount(3);

    expect($byName['handle'])->toBeInstanceOf(MethodDeclaration::class)
        ->and($byName['handle']->visibility)->toBe('public')
        ->and($byName['handle']->isFinal)->toBeTrue()
        ->and($byName['handle']->isStatic)->toBeFalse();

    expect($byName['make']->visibility)->toBe('protected')
        ->and($byName['make']->isStatic)->toBeTrue()
        ->and($byName['make']->isFinal)->toBeFalse();

    expect($byName['internal']->visibility)->toBe('private')
        ->and($byName['internal']->isAbstract)->toBeTrue();
});

it('defaults method visibility to public when unspecified', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Handlers;

    class Handler
    {
        // No visibility keyword — PHP defaults to public and the
        // parser mirrors that so rules relying on `visibility ===
        // 'public'` don't false-negative.
        function handle(): void {}
    }
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    expect($file->methods)->toHaveCount(1)
        ->and($file->methods[0]->name)->toBe('handle')
        ->and($file->methods[0]->visibility)->toBe('public');
});

// -----------------------------------------------------------------
// hasWritableStaticProperty() — Octane-safety helper.
// -----------------------------------------------------------------

it('reports hasWritableStaticProperty true for a static array property', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Services;

    final class Cache
    {
        public static array $items = [];
    }
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    expect($file->hasWritableStaticProperty())->toBeTrue();
});

it('reports hasWritableStaticProperty false for readonly static properties', function (): void {
    // `readonly static` isn't legal PHP today but the parser is
    // forward-compat aware: both flag positions are captured and
    // the `readonly` flag suppresses the "writable" designation.
    // The parser is purely regex-driven so it doesn't care that
    // PHP itself won't compile the sample — it just verifies the
    // metadata classification.
    $source = <<<'PHP'
    <?php
    namespace App\Services;

    final class Cache
    {
        public static readonly array $items = [];
    }
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    expect($file->hasWritableStaticProperty())->toBeFalse();
});

// -----------------------------------------------------------------
// hasClassAttribute() + resolveShortName().
// -----------------------------------------------------------------

it('matches hasClassAttribute by short name and by FQCN', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Repositories;

    #[Repository]
    final class UserRepository {}
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    // Short name.
    expect($file->hasClassAttribute('Repository'))->toBeTrue();

    // Full FQCN — hasClassAttribute normalises both sides to the
    // short name so an FQCN needle finds a short-name haystack.
    expect($file->hasClassAttribute('Academorix\\Architecture\\Attributes\\Repository'))->toBeTrue();

    // Sanity — a non-matching attribute returns false.
    expect($file->hasClassAttribute('Domain'))->toBeFalse();
});

it('resolves a short name back to its imported FQCN', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Http\Controllers;

    use App\Models\User;

    final class UserController {}
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    // The short name matches the last segment of the use statement.
    expect($file->resolveShortName('User'))->toBe('App\\Models\\User');

    // A short name with no matching import returns null so callers
    // can distinguish "not imported" from "imported as global".
    expect($file->resolveShortName('Nonexistent'))->toBeNull();
});

// -----------------------------------------------------------------
// Comment stripping.
// -----------------------------------------------------------------

it('strips comments from strippedContent while rawContent preserves them', function (): void {
    $source = <<<'PHP'
    <?php
    namespace App\Support;

    /**
     * A docblock — should NOT survive the strip pass.
     * @var App\Models\User
     */
    // Line comment — should also be gone.
    final class Foo {}
    PHP;

    $file = (new SourceFileParser())->parseSource('/fake/path.php', $source);

    // Raw content keeps the docblock and line comment verbatim.
    expect($file->rawContent)->toContain('@var App\\Models\\User')
        ->and($file->rawContent)->toContain('// Line comment');

    // Stripped content has both gone.
    expect($file->strippedContent)->not->toContain('@var App\\Models\\User')
        ->and($file->strippedContent)->not->toContain('// Line comment');
});
