<?php

/**
 * @file packages/architecture/src/Support/SourceFileParser.php
 *
 * @description
 * Regex-driven parser that turns a `.php` file into a
 * {@see SourceFile} value object. Intentionally NOT using
 * `nikic/php-parser`:
 *
 *   1. Zero external deps for a lint that already runs in CI.
 *   2. The information we need is a strict subset of what a full
 *      AST would give — namespace, class declaration line,
 *      extends / implements, class attributes, use statements,
 *      and FQCN references. Every one of those has a stable
 *      shape in PSR-12-formatted code (which we enforce via Pint).
 *   3. The parser is `~150` lines of PHP with no dependencies —
 *      easier to reason about than a partial AST walker.
 *
 * ## What the parser DOES catch
 *
 *   - `namespace X\Y;`
 *   - `class Foo`, `final class Foo`, `abstract class Foo`,
 *     `interface Foo`, `trait Foo`, `enum Foo` (with optional
 *     `extends` / `implements`).
 *   - `#[Attr]` and `#[Attr(a, b)]` on the class declaration
 *     (both single-line and multi-line attribute groups).
 *   - `use X\Y;`, `use X\Y as Z;`, `use function foo`,
 *     `use const BAR`. Grouped imports (`use X\{Y, Z}`) are
 *     expanded.
 *   - Inline `\App\Models\User` references anywhere in the file
 *     body — new expressions, type hints, static calls, etc.
 *
 * ## What the parser DOES NOT catch
 *
 *   - Anonymous classes (`new class extends X`) — rare in
 *     production code; treated as invisible.
 *   - Class references inside strings that don't start with a
 *     leading `\`. If a domain-critical string carries an FQCN,
 *     that's an anti-pattern worth flagging separately.
 *   - Multiple class declarations per file (PSR-4 forbids this;
 *     we take the first).
 *
 * ## Octane safety
 *
 * Stateless — every `parse()` call is independent. Regex patterns
 * are process-static constants; no reflection, no I/O beyond the
 * initial `file_get_contents` (which the caller supplies).
 */

declare(strict_types=1);

namespace Stackra\Architecture\Support;

/**
 * Parse a PHP source string into a {@see SourceFile}.
 *
 * @final
 */
final class SourceFileParser
{
    /**
     * Namespace declaration line.
     * Captures the dotted namespace path in group 1.
     */
    private const string NAMESPACE_PATTERN = '/^\s*namespace\s+([A-Za-z_][A-Za-z0-9_\\\\]*)\s*;/m';

    /**
     * Class / interface / trait / enum declaration head. Captures:
     *   1 → modifiers (`abstract`, `final`, `readonly`, space-separated,
     *        may be present in any order — captured verbatim).
     *   2 → keyword (`class` / `interface` / `trait` / `enum`)
     *   3 → the identifier
     *   4 → optional `extends X` (X captured)
     *   5 → optional `implements X, Y, Z` (comma list captured)
     *
     * Handles `final class`, `abstract class`, `readonly class`
     * (PHP 8.2+) in any legal order.
     */
    private const string CLASS_PATTERN = '/^\s*((?:(?:abstract|final|readonly)\s+){0,3})(class|interface|trait|enum)\s+([A-Za-z_][A-Za-z0-9_]*)(?:\s+extends\s+([A-Za-z_][A-Za-z0-9_\\\\]*))?(?:\s+implements\s+([A-Za-z_][A-Za-z0-9_\\\\,\s]*))?\s*(?:\{|:|$)/mi';

    /**
     * Class-level attribute. Captured across multi-line class
     * declarations by anchoring to the class keyword AFTER the
     * `#[...]` group.
     *
     * Group 1 → the raw attribute contents (may include commas /
     *           arguments, e.g. `#[Attr('x', foo: 1)]`).
     */
    private const string ATTRIBUTE_PATTERN = '/#\[([^\]]+)\]/';

    /**
     * `use X\Y;` / `use X\Y as Z;` / `use function foo;` /
     * `use const BAR;`. Handles up to the semicolon.
     *
     * Groups:
     *   1 → optional `function`/`const`
     *   2 → the imported path
     *   3 → optional alias
     */
    private const string USE_PATTERN = '/^\s*use\s+(function\s+|const\s+)?([A-Za-z_][A-Za-z0-9_\\\\]*)(?:\s+as\s+([A-Za-z_][A-Za-z0-9_]*))?\s*;/m';

    /**
     * Grouped `use X\{Y, Z, W as A};`.
     *
     * Groups:
     *   1 → common prefix (`X`)
     *   2 → comma list inside braces
     */
    private const string GROUPED_USE_PATTERN = '/^\s*use\s+([A-Za-z_][A-Za-z0-9_\\\\]*)\\\\\{([^}]+)\}\s*;/m';

    /**
     * Inline fully-qualified name reference — any identifier
     * starting with a backslash and containing at least one more
     * backslash. Deliberately conservative: we skip single-segment
     * `\Foo` references (they're rare in domain code and would
     * inflate the false-positive rate).
     */
    private const string INLINE_FQCN_PATTERN = '/\\\\([A-Za-z_][A-Za-z0-9_]*(?:\\\\[A-Za-z_][A-Za-z0-9_]*)+)/';

    /**
     * Property declaration in a class body. Captures:
     *   1 → visibility (`public` / `protected` / `private`)
     *   2 → `static` keyword (optional)
     *   3 → `readonly` keyword (optional)
     *   4 → property name (WITHOUT the `$` sigil)
     *
     * Order-tolerant: PHP allows `public static readonly` or
     * `public readonly static` — the two optional-modifier groups
     * before the type can appear in either order.
     *
     * The pattern deliberately does NOT capture the type or the
     * default value; rules that need those inspect the raw
     * content on demand.
     */
    private const string PROPERTY_PATTERN = '/^\s*(public|protected|private)(?:\s+(static|readonly))?(?:\s+(static|readonly))?(?:\s+(?:\??[A-Za-z_\\\\][\w\\\\|&]*))?\s+\$([A-Za-z_][A-Za-z0-9_]*)\s*(?:=|;)/m';

    /**
     * Method declaration in a class body. Captures:
     *   1 → the "modifiers-and-visibility" prefix as a single
     *        whitespace-delimited string (any order permitted).
     *        Empty when the method has no keywords before
     *        `function` — PHP defaults to `public` in that case.
     *   2 → method name
     *
     * The prefix is parsed inside {@see extractMethods()} to
     * pull visibility + individual flags. Merging capture into
     * one group lets us accept legal PHP orderings like:
     *
     *   `final public function` — modifier before visibility
     *   `public final function` — visibility before modifier
     *   `abstract static protected function` — three keywords
     *
     * Constructor `__construct()` is captured like any other
     * method.
     */
    private const string METHOD_PATTERN = '/^\s*((?:(?:public|protected|private|abstract|final|static)\s+)*)function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/m';

    /**
     * Constructor promoted-property capture. Runs against the
     * body of a `function __construct(...)` signature. Captures:
     *   1 → visibility (`public` / `protected` / `private`)
     *   2 → `readonly` keyword (optional)
     *   3 → property name (WITHOUT the `$` sigil)
     *
     * We only capture promoted properties (those with a visibility
     * modifier). Plain constructor parameters (`function __construct(
     * string $x)`) are ignored.
     */
    private const string PROMOTED_PROPERTY_PATTERN = '/(public|protected|private)\s+(?:(readonly)\s+)?(?:\??[A-Za-z_\\\\][\w\\\\|&]*\s+)?\$([A-Za-z_][A-Za-z0-9_]*)/';

    /**
     * Parse an on-disk file. Reads bytes via `file_get_contents`
     * and delegates to {@see parseSource()}. Returns `null` when
     * the file can't be read — callers treat that as "skip
     * silently" rather than fail the whole scan.
     */
    public function parseFile(string $path): ?SourceFile
    {
        $content = @file_get_contents($path);
        if ($content === false) {
            return null;
        }

        return $this->parseSource($path, $content);
    }

    /**
     * Parse a PHP source string. `$path` is stored on the
     * resulting {@see SourceFile} but not otherwise inspected —
     * this method is trivially testable with synthetic content.
     */
    public function parseSource(string $path, string $content): SourceFile
    {
        // Strip comments EARLY so `/** @var App\Models\User */`
        // doesn't get counted as an inline FQCN reference. Uses a
        // conservative regex that removes // and /* */ blocks
        // without touching string literals — good enough for PSR-12
        // code where comments don't cross statement boundaries.
        $stripped = $this->stripComments($content);

        $namespace = $this->extractNamespace($stripped);
        [$classKeyword, $className, $classModifiers, $extends, $implements] = $this->extractClassHead($stripped);
        $classAttributes = $this->extractClassAttributes($stripped);

        $classFqcn = $className !== null && $namespace !== null
            ? $namespace . '\\' . $className
            : $className;

        $useStatements = $this->extractUseStatements($stripped);
        $inlineReferences = $this->extractInlineReferences($stripped);

        $properties = $this->extractProperties($stripped);
        $methods = $this->extractMethods($stripped);

        // Fold constructor-promoted properties into the property
        // list so rules that inspect the class's data surface
        // don't have to look at both places.
        foreach ($this->extractPromotedProperties($stripped) as $promoted) {
            $properties[] = $promoted;
        }

        return new SourceFile(
            path: $path,
            namespace: $namespace,
            className: $className,
            classFqcn: $classFqcn,
            classModifiers: $classModifiers,
            classKeyword: $classKeyword,
            extends: $extends,
            implements: $implements,
            classAttributes: $classAttributes,
            useStatements: $useStatements,
            inlineReferences: $inlineReferences,
            properties: $properties,
            methods: $methods,
            strippedContent: $stripped,
            rawContent: $content,
        );
    }

    // -----------------------------------------------------------------
    // Extraction helpers.
    // -----------------------------------------------------------------

    /**
     * `namespace X\Y;` → `'X\\Y'`. Returns `null` for global-
     * namespace files.
     */
    private function extractNamespace(string $content): ?string
    {
        if (preg_match(self::NAMESPACE_PATTERN, $content, $matches) === 1) {
            return trim($matches[1], '\\');
        }

        return null;
    }

    /**
     * Extract the first class-like declaration and its
     * `extends` / `implements` clauses.
     *
     * @return array{0: string|null, 1: string|null, 2: list<string>, 3: string|null, 4: list<string>}
     *         Tuple: [keyword, className, modifiers, extends, implements].
     *         Modifiers is a list of lowercased strings (`final`,
     *         `abstract`, `readonly`) preserved in the order they
     *         appeared. `null` name means no class-like declaration.
     */
    private function extractClassHead(string $content): array
    {
        if (preg_match(self::CLASS_PATTERN, $content, $matches) !== 1) {
            return [null, null, [], null, []];
        }

        $modifiers = [];
        $rawModifiers = trim($matches[1] ?? '');
        if ($rawModifiers !== '') {
            foreach (preg_split('/\s+/', strtolower($rawModifiers)) ?: [] as $modifier) {
                if ($modifier !== '') {
                    $modifiers[] = $modifier;
                }
            }
        }

        $keyword = isset($matches[2]) ? strtolower($matches[2]) : null;
        $name = $matches[3] ?? null;
        $extends = ($matches[4] ?? '') !== '' ? $matches[4] : null;

        $implements = [];
        if (($matches[5] ?? '') !== '') {
            foreach (explode(',', $matches[5]) as $iface) {
                $trimmed = trim($iface);
                if ($trimmed !== '') {
                    $implements[] = $trimmed;
                }
            }
        }

        return [$keyword, $name, $modifiers, $extends, $implements];
    }

    /**
     * Extract class-level attributes. We DON'T try to bind them
     * to the exact class declaration; instead we take every
     * `#[...]` group that appears BEFORE the class keyword and
     * assume they're all class attributes.
     *
     * That's the shape PSR-12 produces (attributes always sit
     * above their target) and dramatically simplifies the
     * regex without hurting accuracy.
     *
     * @return list<string>
     */
    private function extractClassAttributes(string $content): array
    {
        // Slice off everything from the class keyword onwards.
        if (preg_match(self::CLASS_PATTERN, $content, $matches, PREG_OFFSET_CAPTURE) !== 1) {
            return [];
        }

        $classOffset = (int) $matches[0][1];
        $preamble = substr($content, 0, $classOffset);

        if (preg_match_all(self::ATTRIBUTE_PATTERN, $preamble, $all) === false) {
            return [];
        }

        $attributes = [];
        foreach ($all[1] ?? [] as $rawInner) {
            // Take just the attribute NAME — everything before the
            // first `(` or `,` (multiple attributes in one group).
            foreach (explode(',', $rawInner) as $single) {
                $trimmed = trim($single);
                if ($trimmed === '') {
                    continue;
                }

                // Drop the argument list if present.
                $parenPos = strpos($trimmed, '(');
                $name = $parenPos !== false ? substr($trimmed, 0, $parenPos) : $trimmed;
                $name = trim($name);
                if ($name === '') {
                    continue;
                }

                $attributes[] = ltrim($name, '\\');
            }
        }

        return $attributes;
    }

    /**
     * Extract every `use` line — both simple imports and the
     * grouped `use X\{Y, Z}` form.
     *
     * @return list<UseStatement>
     */
    private function extractUseStatements(string $content): array
    {
        $statements = [];

        // 1) Simple imports.
        if (preg_match_all(self::USE_PATTERN, $content, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE)) {
            foreach ($matches as $match) {
                $kindKeyword = trim(($match[1][0] ?? '') === '' ? '' : $match[1][0]);
                $kind = match ($kindKeyword) {
                    'function' => UseStatement::KIND_FUNCTION,
                    'const' => UseStatement::KIND_CONST,
                    default => UseStatement::KIND_CLASS,
                };

                $statements[] = new UseStatement(
                    fqcn: trim($match[2][0], '\\'),
                    alias: ($match[3][0] ?? '') !== '' ? $match[3][0] : null,
                    kind: $kind,
                    line: $this->offsetToLine($content, (int) $match[0][1]),
                );
            }
        }

        // 2) Grouped imports — expand each brace member into an
        // independent UseStatement.
        if (preg_match_all(self::GROUPED_USE_PATTERN, $content, $groupMatches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE)) {
            foreach ($groupMatches as $match) {
                $prefix = trim($match[1][0], '\\');
                $line = $this->offsetToLine($content, (int) $match[0][1]);

                foreach (explode(',', $match[2][0]) as $member) {
                    $member = trim($member);
                    if ($member === '') {
                        continue;
                    }

                    // A grouped member may have its own alias:
                    // `use App\{Foo, Bar as Baz};`.
                    $alias = null;
                    if (preg_match('/^(.+?)\s+as\s+([A-Za-z_][A-Za-z0-9_]*)$/i', $member, $aliasMatch) === 1) {
                        $memberName = trim($aliasMatch[1]);
                        $alias = $aliasMatch[2];
                    } else {
                        $memberName = $member;
                    }

                    $statements[] = new UseStatement(
                        fqcn: $prefix . '\\' . ltrim($memberName, '\\'),
                        alias: $alias,
                        kind: UseStatement::KIND_CLASS,
                        line: $line,
                    );
                }
            }
        }

        return $statements;
    }

    /**
     * Extract inline FQCN references anywhere in the file body.
     * Uses conservative pattern: only backslash-prefixed names
     * with at least one namespace segment. Deduplicates by
     * (fqcn, line).
     *
     * @return list<InlineReference>
     */
    private function extractInlineReferences(string $content): array
    {
        if (preg_match_all(self::INLINE_FQCN_PATTERN, $content, $matches, PREG_OFFSET_CAPTURE) === false) {
            return [];
        }

        $references = [];
        $seen = [];

        foreach ($matches[1] ?? [] as $match) {
            $fqcn = $match[0];
            $line = $this->offsetToLine($content, (int) $match[1]);

            $key = $fqcn . '|' . $line;
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;

            $references[] = new InlineReference(fqcn: $fqcn, line: $line);
        }

        return $references;
    }

    /**
     * Extract every property declaration in the file. Constructor
     * promoted properties are NOT captured here — they get their
     * own pass via {@see extractPromotedProperties()} so we can
     * flag them with `isPromoted = true`.
     *
     * @return list<PropertyDeclaration>
     */
    private function extractProperties(string $content): array
    {
        if (preg_match_all(self::PROPERTY_PATTERN, $content, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE) === false) {
            return [];
        }

        $properties = [];
        foreach ($matches as $match) {
            $visibility = strtolower($match[1][0]);

            // Modifiers can appear in either of the two optional slots
            // (`public static readonly` OR `public readonly static`).
            // Read both and check for the keyword we care about.
            $modifier1 = strtolower($match[2][0] ?? '');
            $modifier2 = strtolower($match[3][0] ?? '');
            $isStatic = in_array('static', [$modifier1, $modifier2], true);
            $isReadonly = in_array('readonly', [$modifier1, $modifier2], true);

            $properties[] = new PropertyDeclaration(
                name: $match[4][0],
                visibility: $visibility,
                isStatic: $isStatic,
                isReadonly: $isReadonly,
                isPromoted: false,
                line: $this->offsetToLine($content, (int) $match[0][1]),
            );
        }

        return $properties;
    }

    /**
     * Extract every method declaration in the file.
     *
     * @return list<MethodDeclaration>
     */
    private function extractMethods(string $content): array
    {
        if (preg_match_all(self::METHOD_PATTERN, $content, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE) === false) {
            return [];
        }

        $methods = [];
        foreach ($matches as $match) {
            $prefix = strtolower(trim($match[1][0] ?? ''));
            // Split the prefix into individual keyword tokens.
            // preg_split can return `false` on failure — guard
            // explicitly so phpstan sees a `list<string>` here.
            $keywords = [];
            if ($prefix !== '') {
                $split = preg_split('/\s+/', $prefix);
                if (is_array($split)) {
                    $keywords = $split;
                }
            }

            // Visibility defaults to `public` when absent — that
            // matches PHP semantics and keeps rules that check
            // `visibility === 'public'` honest.
            $visibility = 'public';
            $isStatic = false;
            $isFinal = false;
            $isAbstract = false;

            foreach ($keywords as $keyword) {
                switch ($keyword) {
                    case 'public':
                    case 'protected':
                    case 'private':
                        $visibility = $keyword;
                        break;
                    case 'static':
                        $isStatic = true;
                        break;
                    case 'final':
                        $isFinal = true;
                        break;
                    case 'abstract':
                        $isAbstract = true;
                        break;
                    // Any unknown keyword falls through — the
                    // regex only accepts the five above, so this
                    // is a defensive branch.
                }
            }

            $methods[] = new MethodDeclaration(
                name: $match[2][0],
                visibility: $visibility,
                isStatic: $isStatic,
                isFinal: $isFinal,
                isAbstract: $isAbstract,
                line: $this->offsetToLine($content, (int) $match[0][1]),
            );
        }

        return $methods;
    }

    /**
     * Extract promoted properties from the constructor signature.
     *
     * PHP 8 constructor promotion syntax (`public function
     * __construct(public readonly string $x)`) collapses parameter
     * declaration + property declaration into one line. The property
     * regex won't catch these — they're inside a `(...)` group.
     *
     * We locate the `__construct(...)` argument list, extract the
     * parenthesised contents, then run
     * {@see self::PROMOTED_PROPERTY_PATTERN} against it.
     *
     * @return list<PropertyDeclaration>
     */
    private function extractPromotedProperties(string $content): array
    {
        // Find the `function __construct(` opening. When it's not
        // present, there are obviously no promoted properties.
        if (preg_match('/function\s+__construct\s*\(/i', $content, $match, PREG_OFFSET_CAPTURE) !== 1) {
            return [];
        }

        // Walk forward from the opening paren counting depth to find
        // the matching close. Depth-aware to handle default values
        // that use nested parens (e.g. `= new SomeClass(...)`).
        $openPos = (int) $match[0][1] + strlen($match[0][0]) - 1;
        $depth = 1;
        $pos = $openPos + 1;
        $length = strlen($content);

        while ($pos < $length && $depth > 0) {
            $char = $content[$pos];
            if ($char === '(') {
                $depth++;
            } elseif ($char === ')') {
                $depth--;
            }
            $pos++;
        }

        if ($depth !== 0) {
            // Malformed constructor — bail rather than throw.
            return [];
        }

        $signatureLine = $this->offsetToLine($content, $openPos);
        $signatureBody = substr($content, $openPos + 1, $pos - $openPos - 2);

        if (preg_match_all(self::PROMOTED_PROPERTY_PATTERN, $signatureBody, $matches, PREG_SET_ORDER) === false) {
            return [];
        }

        $promoted = [];
        foreach ($matches as $match) {
            $promoted[] = new PropertyDeclaration(
                name: $match[3],
                visibility: strtolower($match[1]),
                isStatic: false, // Promoted properties cannot be static.
                isReadonly: ($match[2] ?? '') !== '',
                isPromoted: true,
                line: $signatureLine,
            );
        }

        return $promoted;
    }

    /**
     * Remove `//` line comments and `/* ... * /` block comments so
     * they don't contribute false positives to the inline-FQCN
     * scanner. The regex is deliberately conservative:
     *
     *   - Preserves string literals (no attempt to parse strings
     *     — strings containing `//` inside their body pass
     *     through unchanged, and the FQCN pattern would still
     *     miss them because we require a leading backslash).
     *   - Handles nested `/* ... * /` blocks by using a lazy
     *     matcher.
     */
    private function stripComments(string $content): string
    {
        // Order matters: strip block comments first (they can
        // contain `//` without being line comments), then line
        // comments.
        $noBlocks = preg_replace('#/\*.*?\*/#s', '', $content) ?? $content;
        $noLines = preg_replace('#//[^\r\n]*#', '', $noBlocks) ?? $noBlocks;

        return $noLines;
    }

    /**
     * Translate a byte offset into a 1-indexed line number by
     * counting newlines up to the offset.
     */
    private function offsetToLine(string $content, int $offset): int
    {
        if ($offset <= 0) {
            return 1;
        }

        // +1 because line numbers are 1-indexed and substr_count
        // returns the count of `\n`, so a file's first line
        // (before any newline) is line 1.
        return substr_count(substr($content, 0, $offset), "\n") + 1;
    }
}
