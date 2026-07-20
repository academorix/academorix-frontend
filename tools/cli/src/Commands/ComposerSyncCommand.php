<?php

/**
 * @file ComposerSyncCommand.php
 * @module Academorix\Cli\Commands
 * @description `academorix composer:sync [--dry-run] [--check]
 *   [--verbose]` — walks every composer.json in the workspace and
 *   wires a `type: path` repositories entry for every `@dev` dep whose
 *   target resolves in the workspace. Native replacement for the
 *   retired `scripts/wire-composer-path-repos.py`.
 */

declare(strict_types=1);

namespace Academorix\Cli\Commands;

use Academorix\Cli\Composer\ComposerPathRepoWirer;
use Academorix\Cli\Support\PathResolver;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'composer:sync',
    description: 'Wire Composer @dev deps to path repositories across the workspace.',
    aliases: ['composer:wire'],
)]
final class ComposerSyncCommand extends AbstractCommand
{
    protected function configure(): void
    {
        parent::configure();
        $this->addOption('dry-run', null, InputOption::VALUE_NONE, 'Report only; write nothing.');
        $this->addOption('check', null, InputOption::VALUE_NONE, 'Exit 1 if changes would be applied (CI mode).');
        $this->addOption('verbose-changes', null, InputOption::VALUE_NONE, 'Emit a per-file change line for every touched composer.json.');
        $this->addOption(
            'root',
            null,
            InputOption::VALUE_REQUIRED,
            'Workspace root (defaults to the current workspace).',
        );
    }

    protected function handle(InputInterface $input, OutputInterface $output): int
    {
        $rootOpt = $input->getOption('root');
        $root = is_string($rootOpt) && $rootOpt !== ''
            ? realpath($rootOpt) ?: $rootOpt
            : $this->container->resolve(PathResolver::class)->workspaceRoot();

        $dryRun = (bool) $input->getOption('dry-run') || (bool) $input->getOption('check');
        $verboseChanges = (bool) $input->getOption('verbose-changes');
        $checkMode = (bool) $input->getOption('check');

        $this->omni->titleBar('Composer @dev-dep wiring');

        $wirer = $this->container->resolve(ComposerPathRepoWirer::class);
        $index = $wirer->discoverPackages($root);

        $this->omni->statusInfo(
            'Discovered',
            sprintf('%d packages in %s', count($index), $root),
        );

        $report = $wirer->run($root, $dryRun, $verboseChanges);

        // Emit change lines when verbose.
        if ($verboseChanges && $report->changes !== []) {
            $output->writeln('');
            foreach ($report->changes as $line) {
                $output->writeln($line);
            }
        }

        // Summary.
        $this->omni->tableHeader('Metric', 'Count');
        $this->omni->tableRow('touched', (string) $report->touched);
        $this->omni->tableRow('skipped', (string) $report->skipped);
        $this->omni->tableRow('unresolved', (string) count($report->unresolved));

        if ($report->unresolved !== []) {
            $output->writeln('');
            $output->writeln('<comment>Unresolved @dev deps (target not in workspace):</comment>');
            $candidates = array_keys($index);
            $shown = 0;
            foreach ($report->unresolved as $entry) {
                if ($shown >= 40) {
                    $output->writeln(sprintf('  ... and %d more', count($report->unresolved) - $shown));

                    break;
                }
                [$source, $target] = array_pad(explode(' -> ', $entry, 2), 2, '');
                $hint = $wirer->closestName($target, $candidates);
                $hintSuffix = $hint !== null ? sprintf('   (did you mean %s?)', $hint) : '';
                $output->writeln(sprintf('  - %s%s', $entry, $hintSuffix));
                $shown++;
            }
        }

        if ($checkMode && $report->touched > 0) {
            $this->omni->statusError(
                'Wiring drift',
                sprintf('%d composer.json file(s) would change.', $report->touched),
                [
                    'Re-run `academorix composer:sync` (without --check) to apply.',
                    'Or fix @dev deps by hand and re-run --check to verify.',
                ],
            );

            return 1;
        }

        $this->omni->statusSuccess(
            $dryRun ? 'Dry-run complete' : 'Sync complete',
            sprintf(
                '%d file(s) %s, %d skipped, %d unresolved.',
                $report->touched,
                $dryRun ? 'would change' : 'rewired',
                $report->skipped,
                count($report->unresolved),
            ),
            $report->unresolved === [] ? [] : [
                'Unresolved deps stay untouched; fix the name or author the missing package to wire them.',
            ],
        );

        return 0;
    }
}
