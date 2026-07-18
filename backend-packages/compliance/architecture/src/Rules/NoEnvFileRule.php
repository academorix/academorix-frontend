<?php

/**
 * @file packages/architecture/src/Rules/NoEnvFileRule.php
 *
 * @description
 * Path rule: forbids `.env` (and configured variants) at any
 * app root. Academorix wraps every command with Doppler.
 *
 * ## Why
 *
 * Secrets belong to Doppler, not to disk. Every artisan / test
 * / dev command is invoked via `doppler run -- <command>`
 * (see per-app `.doppler.yaml`). A `.env` file on disk is:
 *
 *   1. **A drift source** — two configs (Doppler + `.env`) that
 *      inevitably diverge.
 *   2. **A leak vector** — `.env` files historically escape into
 *      git or Docker image layers even when `.gitignore`d.
 *   3. **A dev / prod mismatch** — `.env.production` on a dev
 *      machine will accidentally leak prod values on staging.
 *
 * `.env.example` (the checked-in template documenting which
 * variables an app expects) is explicitly permitted.
 *
 * ## What it does
 *
 * For each candidate app root under `$root`, look for each
 * `forbidden_files` entry as a DIRECT child of the app root.
 * Files listed in `allowed_files` are skipped even when their
 * basename matches a forbidden entry (defence in depth — the
 * config should already exclude allowed names from the
 * forbidden list, but the rule enforces both directions).
 *
 * ## Config
 *
 * `config('architecture.rules.no_env_file')`:
 *
 *   - `severity`         — `error` by default.
 *   - `forbidden_files`  — list of basenames (e.g. `.env`,
 *                          `.env.local`, `.env.production`).
 *   - `allowed_files`    — list of basenames permitted even
 *                          when they match a forbidden entry
 *                          (e.g. `.env.example`).
 */

declare(strict_types=1);

namespace Academorix\Architecture\Rules;

use Academorix\Architecture\Violations\Violation;

/**
 * Enforce "Doppler-only — no .env files on disk".
 *
 * @final
 */
final class NoEnvFileRule extends AbstractPathRule
{
    /**
     * Stable dotted identifier.
     */
    public function id(): string
    {
        return 'architecture.no_env_file';
    }

    /**
     * One-line description surfaced by the reporter.
     */
    public function description(): string
    {
        return '.env files are forbidden — Academorix apps wrap every command via `doppler run --` for secrets.';
    }

    /**
     * Walk each candidate app root and flag every forbidden
     * `.env` variant that exists as a direct child file.
     *
     * @param  string          $root  Absolute scan-root path.
     * @return list<Violation>        Zero or more violations.
     */
    public function check(string $root): array
    {
        // Load and coerce the forbidden basename list.
        /** @var list<string> $forbiddenFiles */
        $forbiddenFiles = array_values(array_filter(
            (array) ($this->config['forbidden_files'] ?? []),
            is_string(...),
        ));

        if ($forbiddenFiles === []) {
            return [];
        }

        // Allow-list overrides the forbidden list — `.env.example`
        // is legitimate documentation.
        /** @var list<string> $allowedFiles */
        $allowedFiles = array_values(array_filter(
            (array) ($this->config['allowed_files'] ?? []),
            is_string(...),
        ));

        $violations = [];

        // Iterate candidate app roots and check each forbidden
        // basename as a direct child.
        foreach ($this->candidateAppRoots($root) as $appRoot) {
            foreach ($forbiddenFiles as $basename) {
                // Skip anything explicitly allow-listed.
                if (\in_array($basename, $allowedFiles, true)) {
                    continue;
                }

                $filePath = $appRoot . DIRECTORY_SEPARATOR . $basename;

                // We only flag files, not directories that
                // happen to be named `.env` (basically unheard
                // of, but harmless to guard).
                if (! is_file($filePath)) {
                    continue;
                }

                $violations[] = $this->violation(
                    filePath: $filePath,
                    offender: $basename,
                    message: sprintf(
                        'Forbidden file "%s" exists in %s — secrets belong to Doppler, not to disk.',
                        $basename,
                        $appRoot,
                    ),
                    hint: 'Doppler wraps every command via `doppler run --`. Delete this file and use Doppler for secrets.',
                );
            }
        }

        return $violations;
    }

    /**
     * Yield every candidate "app root" under the scan root.
     * Same pattern as {@see NoRoutesFolderRule::candidateAppRoots()}.
     *
     * @return \Generator<int, string>
     */
    private function candidateAppRoots(string $root): \Generator
    {
        if (file_exists($root . '/composer.json')) {
            yield $root;

            return;
        }

        $entries = @scandir($root);
        if ($entries === false) {
            return;
        }

        foreach ($entries as $entry) {
            if ($entry === '.' || $entry === '..') {
                continue;
            }

            $candidate = $root . DIRECTORY_SEPARATOR . $entry;
            if (is_dir($candidate) && file_exists($candidate . '/composer.json')) {
                yield $candidate;
            }
        }
    }
}
