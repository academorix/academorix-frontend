<?php

/**
 * @file BlueprintValidator.php
 * @module Academorix\Cli\Blueprint
 * @description Shells out to the workspace Python validator
 *   (`validate-module-graph.py --json`) and parses its report. The
 *   validator itself lives in the workspace, not in the CLI — the CLI
 *   only invokes it.
 */

declare(strict_types=1);

namespace Academorix\Cli\Blueprint;

use Academorix\Cli\Exceptions\BlueprintException;
use Academorix\Cli\Support\PathResolver;
use Academorix\Cli\Support\ProcessRunner;
use Symfony\Component\Process\Process;

/**
 * Runs the workspace's Python blueprint validator and unpacks its JSON
 * output.
 */
final class BlueprintValidator
{
    public function __construct(
        private readonly PathResolver $pathResolver,
        private readonly ProcessRunner $runner,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function validate(): array
    {
        $workspaceRoot = $this->pathResolver->workspaceRoot();
        $script = $workspaceRoot.'/blueprints/shared/foundation/scripts/validate-module-graph.py';

        if (! is_file($script)) {
            // No validator on disk yet — return a permissive empty report.
            return ['errors' => [], 'warnings' => [], 'checked' => 0];
        }

        $process = new Process(['python3', $script, '--json'], $workspaceRoot);
        $process->setTimeout(60.0);
        $process->run();

        $stdout = trim($process->getOutput());
        $stderr = trim($process->getErrorOutput());

        if (! $process->isSuccessful() && $stdout === '') {
            throw BlueprintException::forValidatorFailure($stderr === '' ? '(no output)' : $stderr);
        }

        try {
            $decoded = json_decode($stdout === '' ? '{}' : $stdout, associative: true, flags: JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            throw BlueprintException::forValidatorFailure($e->getMessage());
        }

        return is_array($decoded) ? $decoded : [];
    }
}
