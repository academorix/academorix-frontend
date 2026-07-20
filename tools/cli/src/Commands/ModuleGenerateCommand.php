<?php

/**
 * @file ModuleGenerateCommand.php
 * @module Academorix\Cli\Commands
 * @description `academorix module:generate <tier/name>` — v0.1
 *   placeholder. v0.2 will regenerate the module across backend +
 *   frontend + mobile from its blueprint.
 */

declare(strict_types=1);

namespace Academorix\Cli\Commands;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'module:generate',
    description: 'Regenerate a module across services from its blueprint (v0.2).',
)]
final class ModuleGenerateCommand extends AbstractCommand
{
    protected function configure(): void
    {
        parent::configure();
        $this->addArgument('module', InputArgument::REQUIRED, 'Module identifier <tier/name>.');
    }

    protected function handle(InputInterface $input, OutputInterface $output): int
    {
        $this->omni->statusSuccess(
            'Coming in v0.2.0',
            'The module:generate command is planned but not yet implemented.',
            [
                'v0.2 will regenerate backend + frontend + mobile code from the module blueprint.',
                'Existing user edits are preserved via marker comments the generator respects.',
                'Runs the module-graph validator + tenancy-columns auditor before finishing.',
            ],
        );

        return 0;
    }
}
