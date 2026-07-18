<?php

/**
 * @file packages/architecture/src/Rules/NoServiceLayerRule.php
 *
 * @description
 * Path rule: no file may live in a `Services/` directory inside
 * a domain module. Per ADR 0016 (Actions-only architecture),
 * every endpoint is a single Action class — orchestration lives
 * IN the action, not in a separate Service layer.
 *
 * ## What it catches
 *
 * Files whose relative path contains a `/Services/` segment
 * inside a domain module:
 *
 *   apps/{app}/src/modules/{domain}/src/Services/…
 *   apps/{app}/src/modules/{domain}/src/Services/Contracts/…
 *
 * ## Exceptions
 *
 * Framework packages (`packages/framework/*`) are exempt — a
 * `Services/` directory in a framework primitive is a shared
 * utility layer (e.g. `routing/src/Services/VersionComparator.php`),
 * not a domain-orchestration seam. The rule targets domain
 * modules exclusively.
 *
 * ## Paired migrator
 *
 * `dev-tools/migrations/src/ServiceToActionMigrator.php`
 * (delegated to sub-agent) walks every Service class, splits
 * each public method into its own Action class carrying the
 * appropriate route + authorization attributes, and deletes the
 * Service.
 */

declare(strict_types=1);

namespace Academorix\Architecture\Rules;

use Academorix\Architecture\Contracts\PathRule;
use Academorix\Architecture\Violations\Severity;
use Academorix\Architecture\Violations\Violation;
use FilesystemIterator;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

/**
 * Enforce "no `Services/` directory in domain modules".
 *
 * @final
 */
final class NoServiceLayerRule extends AbstractPathRule
{
    public function id(): string
    {
        return 'architecture.no_service_layer';
    }

    public function description(): string
    {
        return 'No `Services/` directory in domain modules — per ADR 0016 every endpoint is a single Action class; orchestration lives in the action, not in a Service layer.';
    }

    protected function defaultSeverity(): Severity
    {
        return Severity::Error;
    }

    /**
     * Walk every configured `search_path`; flag every file whose
     * path contains `/src/modules/<name>/src/Services/`.
     *
     * @return list<Violation>
     */
    public function check(string $projectRoot): array
    {
        $violations = [];

        /** @var list<string> $searchPaths */
        $searchPaths = $this->normaliseStringList($this->config['search_paths'] ?? ['apps']);

        foreach ($searchPaths as $searchPath) {
            $fullPath = $projectRoot . '/' . $searchPath;
            if (! is_dir($fullPath)) {
                continue;
            }

            $iterator = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($fullPath, FilesystemIterator::SKIP_DOTS),
            );

            foreach ($iterator as $file) {
                if (! $file->isFile() || $file->getExtension() !== 'php') {
                    continue;
                }
                $relative = str_replace($projectRoot . '/', '', $file->getPathname());

                if (! $this->isInDomainModuleServices($relative)) {
                    continue;
                }

                $violations[] = new Violation(
                    ruleId: $this->id(),
                    severity: $this->severity(),
                    filePath: $file->getPathname(),
                    offender: $relative,
                    message: "File lives under a domain-module `Services/` directory — per ADR 0016 the Service layer is banned.",
                    line: null,
                    hint: 'Convert this Service to one or more Action classes under `Actions/`. Each public Service method → one Action with `#[AsAction]` + a route verb attribute.',
                );
            }
        }

        return $violations;
    }

    /**
     * Match `apps/{app}/src/modules/{domain}/src/Services/…` — the
     * only shape that violates.
     */
    private function isInDomainModuleServices(string $relativePath): bool
    {
        // `apps/<app>/src/modules/<module>/src/Services/…`
        return (bool) preg_match(
            '#^apps/[^/]+/src/modules/[^/]+/src/Services/#',
            $relativePath,
        );
    }

    /**
     * Coerce a config value into a `list<string>`. Non-string
     * entries are dropped silently — a mis-typed config array
     * degrades to a safe subset instead of throwing at check-time.
     *
     * @return list<string>
     */
    private function normaliseStringList(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $out = [];
        foreach ($value as $entry) {
            if (is_string($entry) && $entry !== '') {
                $out[] = $entry;
            }
        }

        return $out;
    }
}
