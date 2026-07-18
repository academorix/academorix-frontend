<?php

/**
 * @file packages/architecture/src/Support/SourceFile.php
 *
 * @description
 * Immutable value object representing a parsed PHP source file.
 * Wraps the file's disk path plus every piece of metadata the
 * rules need to reason about layers:
 *
 *   - Namespace + class-string
 *   - Base class (`extends`) and implemented interfaces
 *     (`implements`)
 *   - Attributes on the class declaration
 *   - Every `use` statement in the file
 *   - Every fully-qualified reference outside `use` statements
 *
 * Constructed by {@see SourceFileParser::parse()}. Consumed by
 * {@see \Academorix\Architecture\Support\LayerResolver} and by
 * every rule.
 *
 * ## Why a value object (not a struct-like array)
 *
 *   1. Named accessors read better than array keys at call sites.
 *   2. Immutability is enforced by `readonly`; rules can't
 *      accidentally mutate shared state.
 *   3. Type-narrowing in phpstan: `use` statements are `list<string>`,
 *      not `array<mixed>`.
 */

declare(strict_types=1);

namespace Academorix\Architecture\Support;

/**
 * Parsed metadata about a single PHP file.
 *
 * All fields are `readonly` — the parser produces this in one
 * shot and downstream consumers read only.
 *
 * @final
 */
final class SourceFile
{
    /**
     * @param  string            $path              Absolute path on disk.
     * @param  string|null       $namespace         Namespace of the class in the file
     *                                              (e.g. `App\Http\Controllers`), or
     *                                              `null` for global-namespace files.
     * @param  string|null       $className         Class name only (`UserController`).
     *                                              `null` when the file has no class
     *                                              declaration (bootstrap files,
     *                                              helper functions).
     * @param  string|null       $classFqcn         Convenience: `namespace + '\\' + className`
     *                                              pre-computed. `null` when either
     *                                              part is missing.
     * @param  list<string>      $classModifiers    Modifiers on the class declaration
     *                                              (`final`, `abstract`, `readonly`).
     *                                              Empty list when the class has none.
     * @param  string|null       $classKeyword      Which kind of type this file declares
     *                                              — `class`, `interface`, `trait`,
     *                                              `enum`. `null` when there is no
     *                                              class-like declaration.
     * @param  string|null       $extends           FQCN or short name of the parent
     *                                              class, exactly as it appears in the
     *                                              `extends` clause. Resolvers use
     *                                              {@see UseStatements} to expand short
     *                                              names.
     * @param  list<string>      $implements        FQCNs or short names of implemented
     *                                              interfaces, as they appear in
     *                                              `implements`.
     * @param  list<string>      $classAttributes   Attribute FQCNs / short names as they
     *                                              appear on the class declaration.
     * @param  list<UseStatement> $useStatements    Every `use X\Y as Z;` line at the top
     *                                              of the file. Includes `use function`
     *                                              / `use const` — rules that care
     *                                              filter by {@see UseStatement::$kind}.
     * @param  list<InlineReference> $inlineReferences Every FQCN reference that isn't a
     *                                              `use` statement — `\App\Models\User`
     *                                              in code bodies, string literals
     *                                              containing FQCN patterns, etc.
     * @param  list<PropertyDeclaration> $properties Property declarations captured from
     *                                              the class body (visibility, static
     *                                              flag, name, line). Constructor
     *                                              promoted properties are ALSO
     *                                              captured here so rules that care
     *                                              about the class's data surface don't
     *                                              have to inspect the constructor
     *                                              signature separately.
     * @param  list<MethodDeclaration> $methods    Method declarations captured from the
     *                                              class body (visibility, static flag,
     *                                              final flag, abstract flag, name,
     *                                              line).
     * @param  string            $strippedContent   The file contents with comments and
     *                                              docblocks stripped. Used for
     *                                              content-scan rules (`env(` /
     *                                              `Route::get` / `Model::query()`) to
     *                                              avoid false positives on
     *                                              documentation snippets.
     * @param  string            $rawContent        The file's contents. Kept so rules
     *                                              can grep for edge cases the parser
     *                                              doesn't extract.
     */
    public function __construct(
        public readonly string $path,
        public readonly ?string $namespace,
        public readonly ?string $className,
        public readonly ?string $classFqcn,
        public readonly array $classModifiers,
        public readonly ?string $classKeyword,
        public readonly ?string $extends,
        public readonly array $implements,
        public readonly array $classAttributes,
        public readonly array $useStatements,
        public readonly array $inlineReferences,
        public readonly array $properties,
        public readonly array $methods,
        public readonly string $strippedContent,
        public readonly string $rawContent,
    ) {
    }

    /**
     * `true` when the class declaration carries one of the supplied
     * modifiers (`final`, `abstract`, `readonly`).
     */
    public function hasClassModifier(string $modifier): bool
    {
        return in_array(strtolower($modifier), array_map('strtolower', $this->classModifiers), true);
    }

    /**
     * `true` when the file declares a method with the supplied name.
     * Case-insensitive comparison (PHP method names are).
     */
    public function hasMethod(string $name): bool
    {
        foreach ($this->methods as $method) {
            if (strcasecmp($method->name, $name) === 0) {
                return true;
            }
        }

        return false;
    }

    /**
     * Find a method by name, or `null` when the file doesn't declare it.
     */
    public function findMethod(string $name): ?MethodDeclaration
    {
        foreach ($this->methods as $method) {
            if (strcasecmp($method->name, $name) === 0) {
                return $method;
            }
        }

        return null;
    }

    /**
     * `true` when the file declares a static writable property (not a
     * `const` — those are compile-time immutable and safe). Used by
     * the Octane-safety rule that forbids static state on services.
     *
     * A "writable" static is any non-readonly `static $x;` declaration.
     * PHP does not permit `readonly static` today so the readonly
     * check is a forward-compat marker.
     */
    public function hasWritableStaticProperty(): bool
    {
        foreach ($this->properties as $property) {
            if ($property->isStatic && ! $property->isReadonly) {
                return true;
            }
        }

        return false;
    }

    /**
     * `true` when the class declaration carries the supplied
     * attribute (by short name or FQCN). Comparison is case-
     * insensitive because PHP attributes are class-names.
     *
     * Accepts EITHER the full FQCN
     * (`Academorix\Architecture\Attributes\Repository`) or the
     * short form (`Repository`) — the parser normalises both to
     * short names, and this method compares by short name after
     * stripping any leading backslash.
     */
    public function hasClassAttribute(string $attribute): bool
    {
        $needle = $this->shortName($attribute);

        foreach ($this->classAttributes as $stored) {
            if (strcasecmp($this->shortName($stored), $needle) === 0) {
                return true;
            }
        }

        return false;
    }

    /**
     * Full FQCN of a `use` statement whose alias / final segment
     * matches `$shortName`, or `null` when no such import exists.
     * Rules use this to expand short-name references
     * (`class Foo extends Bar`) to their imported FQCNs.
     */
    public function resolveShortName(string $shortName): ?string
    {
        foreach ($this->useStatements as $use) {
            if (strcasecmp($use->localName(), $shortName) === 0) {
                return $use->fqcn;
            }
        }

        return null;
    }

    /**
     * Strip namespace prefix and leading backslash from a class
     * reference, leaving just the final segment.
     */
    private function shortName(string $reference): string
    {
        $trimmed = ltrim($reference, '\\');
        $lastSlash = strrpos($trimmed, '\\');

        return $lastSlash === false ? $trimmed : substr($trimmed, $lastSlash + 1);
    }
}
