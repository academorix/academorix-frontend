<?php

/**
 * @file packages/architecture/src/Support/UseStatement.php
 *
 * @description
 * Parsed representation of a single `use` statement.
 *
 * PHP's `use` is overloaded across three namespaces:
 *
 *   - Class / interface / trait / enum imports (default)
 *   - Function imports (`use function foo`)
 *   - Constant imports (`use const BAR`)
 *
 * The scanner cares about class imports; the other two are
 * captured so rules that want to whitelist them explicitly can.
 *
 * ## Aliases
 *
 * `use App\Models\User as UserModel` produces an instance with
 * `fqcn = 'App\\Models\\User'` and `alias = 'UserModel'`. The
 * {@see localName()} helper resolves to the alias when set,
 * otherwise the last segment of the FQCN.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Support;

/**
 * Immutable value object — one per `use` line in the parsed file.
 *
 * @final
 */
final class UseStatement
{
    /** Regular class / interface / trait / enum import. */
    public const string KIND_CLASS = 'class';

    /** `use function foo`. */
    public const string KIND_FUNCTION = 'function';

    /** `use const BAR`. */
    public const string KIND_CONST = 'const';

    /**
     * @param  string                                        $fqcn   Fully qualified name being imported. Never
     *                                                               starts with a leading backslash.
     * @param  string|null                                   $alias  Local alias (`use X as Y` → `Y`); `null` when
     *                                                               no alias was given.
     * @param  self::KIND_CLASS|self::KIND_FUNCTION|self::KIND_CONST $kind  Which of PHP's three import namespaces.
     * @param  int                                           $line   1-indexed line number in the source.
     */
    public function __construct(
        public readonly string $fqcn,
        public readonly ?string $alias,
        public readonly string $kind,
        public readonly int $line,
    ) {
    }

    /**
     * The name callers use to refer to the import inside the file
     * — alias when present, otherwise the last segment of the FQCN.
     */
    public function localName(): string
    {
        if ($this->alias !== null) {
            return $this->alias;
        }

        $lastSlash = strrpos($this->fqcn, '\\');

        return $lastSlash === false ? $this->fqcn : substr($this->fqcn, $lastSlash + 1);
    }

    /**
     * `true` when this import's FQCN starts with any of the
     * supplied namespace prefixes. Prefixes must include their
     * trailing backslash to avoid greedy matches
     * (`App\Model` shouldn't match `App\ModelSomething`).
     *
     * @param  list<string>  $prefixes
     */
    public function isUnderAnyNamespace(array $prefixes): bool
    {
        foreach ($prefixes as $prefix) {
            if (str_starts_with($this->fqcn, $prefix)) {
                return true;
            }
        }

        return false;
    }
}
