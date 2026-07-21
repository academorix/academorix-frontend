<?php

/**
 * @file MakeModelCommand.php
 * @module Stackra\Cli\Commands
 * @description `stackra make:model <ClassName> --module=<tier/name>` —
 *   v0.1 placeholder. v0.2 emits the 4-file quartet: Interface + Model +
 *   Migration + Factory, wired to the module's ServiceProvider.
 */

declare(strict_types=1);

namespace Stackra\Cli\Commands;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'make:model',
    description: 'Emit the Interface + Model + Migration + Factory quartet (v0.2).',
)]
final class MakeModelCommand extends AbstractCommand
{
    protected function configure(): void
    {
        parent::configure();
        $this->addArgument('name', InputArgument::REQUIRED, 'Model class name (PascalCase, singular).');
        $this->addOption('module', 'm', InputOption::VALUE_REQUIRED, 'Module identifier <tier/name>.');
    }

    protected function handle(InputInterface $input, OutputInterface $output): int
    {
        $this->omni->statusSuccess(
            'Coming in v0.2.0',
            'The make:model command is planned but not yet implemented.',
            [
                'v0.2 emits four files: Contracts/Data/<Name>Interface, Models/<Name>, database/migrations/*, database/factories/<Name>Factory.',
                'Every persisted row inherits the three-axis attribution automatically.',
                'For now, use `stackra make:action` and hand-scaffold the model quartet from the php.* stubs.',
            ],
        );

        return 0;
    }
}
