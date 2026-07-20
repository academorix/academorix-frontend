<?php

/**
 * @file packages/architecture/src/Rules/NoQueryBuilderInServicesRule.php
 *
 * @description
 * Source rule: forbids query-builder usage — `Model::query()`,
 * `DB::table()`, `DB::query()` — inside Service and Action
 * classes. Query construction lives EXCLUSIVELY in the
 * Repository layer. Services orchestrate; Repositories query.
 *
 * ## Why
 *
 * Services that build their own queries duplicate what should
 * be one canonical repository method, drift out of sync with
 * eager-load conventions, and make bulk-query optimisation
 * impossible. Concentrating all queries in Repositories gives
 * one place to add caching, tenant scoping, tracing, and
 * eager-load defaults.
 *
 * ## What it catches
 *
 * For files the resolver classifies as
 * {@see LayerType::Service} or {@see LayerType::Action}, three
 * independent signals each fire:
 *
 *   1. Inline FQCN `\App\Models\Foo::query(...)` — walk
 *      {@see SourceFile::$inlineReferences}. When a reference's
 *      FQCN sits under a configured `model_namespaces` prefix,
 *      check whether that FQCN appears in the stripped content
 *      followed by `::query(` on the same match.
 *
 *   2. Imported model + short-name call — for each `use`
 *      statement whose FQCN starts with a `model_namespaces`
 *      prefix, look for `<LocalName>::query(` in the stripped
 *      content.
 *
 *   3. `DB::table(` / `DB::query(` — search for each substring
 *      in `query_facades`.
 *
 * Comments and docblocks are stripped upstream so example
 * snippets don't trigger. Each match on a distinct line
 * produces one violation.
 *
 * ## Config
 *
 * `config('architecture.rules.no_query_builder_in_services')`:
 *
 *   - `severity`          — `error` by default.
 *   - `model_namespaces`  — list of namespace prefixes for
 *                           model classes (with trailing
 *                           backslash).
 *   - `query_facades`     — list of exact substrings to flag
 *                           (e.g. `DB::table`, `DB::query`).
 */

declare(strict_types=1);

namespace Academorix\Architecture\Rules;

use Academorix\Architecture\Enums\LayerType;
use Academorix\Architecture\Support\SourceFile;
use Academorix\Architecture\Support\UseStatement;
use Academorix\Architecture\Violations\Severity;
use Academorix\Architecture\Violations\Violation;

/**
 * Ban query-builder usage inside Service / Action classes.
 *
 * @final
 */
final class NoQueryBuilderInServicesRule extends AbstractRule
{
    /**
     * Stable dotted identifier.
     */
    public function id(): string
    {
        return 'architecture.no_query_builder_in_services';
    }

    /**
     * One-line description surfaced by the reporter.
     */
    public function description(): string
    {
        return 'Services and Actions must not build queries directly — route every query through a Repository.';
    }

    /**
     * Duplicated query logic is a source of eager-load and
     * scoping drift. Fail CI.
     */
    protected function defaultSeverity(): Severity
    {
        return Severity::Error;
    }

    /**
     * Emit violations for each of the three query-builder
     * signals, deduped by line.
     *
     * @param  SourceFile     $file  Parsed source file.
     * @return list<Violation>       Zero or more violations.
     */
    public function check(SourceFile $file): array
    {
        // Only Services / Actions are subject to this rule.
        $layer = $this->layers->resolve($file);
        if ($layer !== LayerType::Service && $layer !== LayerType::Action) {
            return [];
        }

        $modelNamespaces = $this->listOfStrings($this->config['model_namespaces'] ?? []);
        $queryFacades = $this->listOfStrings($this->config['query_facades'] ?? []);

        // Nothing configured at all — rule is effectively off.
        if ($modelNamespaces === [] && $queryFacades === []) {
            return [];
        }

        $content = $file->strippedContent;
        $violations = [];
        // Dedupe by line: multiple signals on one line count as
        // one violation to keep the reporter output sane.
        $seenLines = [];

        // Signal 1 — inline FQCN model with `::query(` right
        // after. We walk the parsed inline references (which
        // give us the FQCN + line) and re-check the stripped
        // content on that specific line for the `::query(`
        // token.
        foreach ($file->inlineReferences as $ref) {
            if ($modelNamespaces === [] || ! $ref->isUnderAnyNamespace($modelNamespaces)) {
                continue;
            }

            if (isset($seenLines[$ref->line])) {
                continue;
            }

            $lineText = $this->extractLine($content, $ref->line);
            // Match both `\App\Models\Foo::query(` and
            // `App\Models\Foo::query(` on the same line.
            $normalisedFqcn = \preg_quote($ref->fqcn, '/');
            if (\preg_match('/\\\\?' . $normalisedFqcn . '\s*::\s*query\s*\(/', $lineText) !== 1) {
                continue;
            }

            $seenLines[$ref->line] = true;
            $violations[] = $this->violation(
                file: $file,
                offender: $ref->fqcn . '::query()',
                message: \sprintf(
                    'Inline call `%s::query()` in %s "%s" — route the query through a Repository.',
                    $ref->fqcn,
                    $layer->label(),
                    $file->classFqcn ?? $file->path,
                ),
                line: $ref->line,
                hint: 'Route the query through a Repository. Services never build queries directly.',
            );
        }

        // Signal 2 — imported model short-name followed by
        // `::query(`. Iterate every use statement under
        // `model_namespaces` and search for the local name.
        foreach ($file->useStatements as $use) {
            if ($use->kind !== UseStatement::KIND_CLASS) {
                continue;
            }
            if ($modelNamespaces === [] || ! $use->isUnderAnyNamespace($modelNamespaces)) {
                continue;
            }

            $local = $use->localName();
            $pattern = '/\b' . \preg_quote($local, '/') . '\s*::\s*query\s*\(/';

            if (\preg_match_all($pattern, $content, $matches, \PREG_OFFSET_CAPTURE) === false) {
                continue;
            }

            if (! isset($matches[0]) || $matches[0] === []) {
                continue;
            }

            foreach ($matches[0] as $match) {
                /** @var array{0: string, 1: int} $match */
                $line = $this->lineForOffset($content, $match[1]);
                if (isset($seenLines[$line])) {
                    continue;
                }
                $seenLines[$line] = true;

                $violations[] = $this->violation(
                    file: $file,
                    offender: $local . '::query()',
                    message: \sprintf(
                        'Call `%s::query()` in %s "%s" — route the query through a Repository.',
                        $local,
                        $layer->label(),
                        $file->classFqcn ?? $file->path,
                    ),
                    line: $line,
                    hint: 'Route the query through a Repository. Services never build queries directly.',
                );
            }
        }

        // Signal 3 — DB:: facade calls. Each configured facade
        // is a plain substring; convert to a regex that fires
        // on `<needle>(` so `DB::tableFoo` in unrelated code
        // doesn't accidentally match `DB::table`.
        foreach ($queryFacades as $needle) {
            if (\strpos($content, $needle) === false) {
                continue;
            }

            $pattern = '/\b' . \preg_quote($needle, '/') . '\s*\(/';
            if (\preg_match_all($pattern, $content, $matches, \PREG_OFFSET_CAPTURE) === false) {
                continue;
            }

            if (! isset($matches[0]) || $matches[0] === []) {
                continue;
            }

            foreach ($matches[0] as $match) {
                /** @var array{0: string, 1: int} $match */
                $line = $this->lineForOffset($content, $match[1]);
                if (isset($seenLines[$line])) {
                    continue;
                }
                $seenLines[$line] = true;

                $violations[] = $this->violation(
                    file: $file,
                    offender: $needle,
                    message: \sprintf(
                        '`%s()` call in %s "%s" — the DB facade is banned outside Repositories.',
                        $needle,
                        $layer->label(),
                        $file->classFqcn ?? $file->path,
                    ),
                    line: $line,
                    hint: 'Route the query through a Repository. Services never build queries directly.',
                );
            }
        }

        return $violations;
    }

    /**
     * Extract the source of the given 1-indexed line. Returns
     * an empty string when the line number is out of range —
     * safe for downstream regex matching.
     */
    private function extractLine(string $content, int $line): string
    {
        if ($line <= 0) {
            return '';
        }

        $lines = \explode("\n", $content);

        return $lines[$line - 1] ?? '';
    }

    /**
     * Translate a byte offset within the file content into a
     * 1-indexed line number.
     */
    private function lineForOffset(string $content, int $offset): int
    {
        if ($offset <= 0) {
            return 1;
        }

        return \substr_count($content, "\n", 0, $offset) + 1;
    }
}
