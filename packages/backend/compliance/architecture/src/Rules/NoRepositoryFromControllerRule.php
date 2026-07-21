<?php

/**
 * @file packages/architecture/src/Rules/NoRepositoryFromControllerRule.php
 *
 * @description
 * Strict-mode rule: Controllers may not import Repositories
 * directly. Every persistence read/write on the request path
 * must flow through a Service or Action.
 *
 * ## Why opt-in
 *
 * Some teams accept "Controller → Repository" for pure read
 * queries (list endpoints, `show()` handlers) and only route
 * writes through Services. The rule is DISABLED by default and
 * enabled via `config('architecture.rules.no_repository_from_controller.enabled')`
 * so teams that want the stricter shape can flip it on when
 * ready.
 *
 * ## What counts as a "Repository import"
 *
 *   1. A `use` statement whose FQCN is under any configured
 *      `repository_namespaces` prefix.
 *   2. A `use` statement whose target class is marked with the
 *      `#[Repository]` attribute or implements
 *      {@see \Stackra\Architecture\Contracts\Repository}.
 *
 * The second check requires resolving the imported class's OWN
 * metadata — which we can do because the scanner parses every
 * file up-front. We look up the imported FQCN in the scanner's
 * class-metadata map (passed in at construction), and consult
 * the layer resolver on the target file.
 *
 * ## Fast path
 *
 * When `enabled=false` the rule returns immediately from
 * `check()` without inspecting the file — makes the rule
 * effectively free when disabled.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Rules;

use Stackra\Architecture\Enums\LayerType;
use Stackra\Architecture\Support\SourceFile;
use Stackra\Architecture\Violations\Severity;

/**
 * Opt-in strict-mode enforcement of "Controllers never touch
 * Repositories".
 *
 * @final
 */
final class NoRepositoryFromControllerRule extends AbstractRule
{
    public function id(): string
    {
        return 'architecture.no_repository_from_controller';
    }

    public function description(): string
    {
        return 'Controllers must go through a Service or Action to reach Repositories.';
    }

    protected function defaultSeverity(): Severity
    {
        // Warning by default because this is a stylistic
        // preference more than an absolute rule.
        return Severity::Warning;
    }

    /**
     * @return list<\Stackra\Architecture\Violations\Violation>
     */
    public function check(SourceFile $file): array
    {
        // Opt-in — bail immediately when disabled.
        if (($this->config['enabled'] ?? false) !== true) {
            return [];
        }

        // Only Controllers are subject to this rule.
        $layer = $this->layers->resolve($file);
        if ($layer !== LayerType::Controller) {
            return [];
        }

        $repositoryNamespaces = $this->listOfStrings($this->config['repository_namespaces'] ?? []);
        if ($repositoryNamespaces === []) {
            return [];
        }

        $violations = [];

        foreach ($file->useStatements as $use) {
            if (! $use->isUnderAnyNamespace($repositoryNamespaces)) {
                continue;
            }

            $violations[] = $this->violation(
                file: $file,
                offender: $use->fqcn,
                message: sprintf(
                    'Repository "%s" imported directly from Controller "%s" — go through a Service.',
                    $use->fqcn,
                    $file->classFqcn ?? $file->path,
                ),
                line: $use->line,
                hint: 'Introduce a Service that owns the Repository and inject the Service in the Controller instead.',
            );
        }

        // Inline references matter too — someone bypassing the
        // import via `\App\Repositories\UserRepository`.
        foreach ($file->inlineReferences as $ref) {
            if (! $ref->isUnderAnyNamespace($repositoryNamespaces)) {
                continue;
            }

            $violations[] = $this->violation(
                file: $file,
                offender: $ref->fqcn,
                message: sprintf(
                    'Inline Repository reference "%s" in Controller "%s" — go through a Service.',
                    $ref->fqcn,
                    $file->classFqcn ?? $file->path,
                ),
                line: $ref->line,
                hint: 'Replace the inline reference with a Service call.',
            );
        }

        return $violations;
    }
}
