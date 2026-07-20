<?php

/**
 * @file NewProjectCommand.php
 * @module Academorix\Cli\Commands
 * @description `academorix new <name> [--preset=<business-type>]`
 *   Bootstraps a new Academorix project. Interactive Laravel Prompts drive
 *   business-type + capability selection. Resolved packages are shown as
 *   an OmniTerm table before the caller confirms. Template hydration is
 *   deferred to v0.2 (templates aren't authored yet); v0.1 reports the
 *   selection and stops there.
 */

declare(strict_types=1);

namespace Academorix\Cli\Commands;

use Academorix\Cli\Catalog\CatalogEntry;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'new',
    description: 'Bootstrap a new Academorix project from the workspace catalog.',
)]
final class NewProjectCommand extends AbstractCommand
{
    protected function configure(): void
    {
        parent::configure();
        $this->addArgument('name', InputArgument::REQUIRED, 'Project name (kebab-case, 2-30 chars).');
        $this->addOption(
            'preset',
            null,
            InputOption::VALUE_REQUIRED,
            'Business-type preset: salon | gym | academy | clinic | custom.',
            'custom',
        );
    }

    protected function handle(InputInterface $input, OutputInterface $output): int
    {
        $name = (string) $input->getArgument('name');
        $this->assertValidProjectName($name);

        $destination = getcwd().'/'.$name;
        $this->assertDirectoryDoesNotExist($destination);

        $preset = (string) $input->getOption('preset');
        $query = $this->catalogQuery();

        // Business type selection.
        $businessType = $this->askSelect(
            'Which business type is this project for?',
            $query->businessTypes(),
            in_array($preset, array_keys($query->businessTypes()), true) ? $preset : 'custom',
        );

        // Capability multiselect.
        $selectedCapabilities = $this->askMultiselect(
            'Which capabilities does this project need?',
            $query->allCapabilityGroups(),
            $query->defaultsForBusinessType($businessType),
        );

        // Resolve.
        $selection = $query->resolvePackages($selectedCapabilities);

        // Report.
        $this->omni->titleBar(sprintf('Project "%s" — %d packages selected', $name, $selection->count()));
        $this->omni->tableHeader('Tier', 'Package', 'Purpose');
        foreach ($selection->all() as $entry) {
            $this->omni->tableRow(
                $entry->tier,
                $entry->name,
                mb_strimwidth($entry->purpose, 0, 60, '...'),
            );
        }

        if ($selection->isEmpty()) {
            $this->omni->statusError(
                'No packages matched your selection',
                'Zero catalog entries carry any of the capabilities you picked.',
                [
                    'Re-run the command and pick at least one capability.',
                    'Run `academorix catalog:list` to see every known package.',
                ],
            );

            return 2;
        }

        if (! $this->askConfirm('Proceed with these packages?', true)) {
            $this->omni->statusInfo('Aborted', 'No files written.');

            return 0;
        }

        // Template hydration is v0.2 work. Report the plan and stop.
        $this->omni->statusSuccess(
            'Project ready to scaffold',
            sprintf('%d packages selected. Template hydration lands in v0.2.', $selection->count()),
            [
                sprintf('Destination: %s', $destination),
                sprintf('Business type: %s', $businessType),
                sprintf('Capabilities: %s', implode(', ', $selectedCapabilities)),
                'Next: `academorix package:add <name>` to install individual packages once v0.2 ships.',
            ],
        );

        // Emit a machine-readable plan for chained tooling.
        $planPath = getcwd().'/'.$name.'.plan.json';
        $this->writeFile($planPath, json_encode([
            'name' => $name,
            'businessType' => $businessType,
            'capabilities' => $selectedCapabilities,
            'packages' => array_map(static fn (CatalogEntry $e): array => [
                'name' => $e->name,
                'tier' => $e->tier,
                'purpose' => $e->purpose,
            ], $selection->all()),
            'generatedAt' => date(DATE_ATOM),
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) ?: '{}');

        $this->omni->statusInfo('Plan saved', 'Written to '.$planPath);

        return 0;
    }
}
