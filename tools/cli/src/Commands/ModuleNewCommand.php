<?php

/**
 * @file ModuleNewCommand.php
 * @module Academorix\Cli\Commands
 * @description `academorix module:new <tier/name>` — v0.1 placeholder.
 *   v0.2 will scaffold the full 30-JSON blueprint set and run the
 *   validator.
 */

declare(strict_types=1);

namespace Academorix\Cli\Commands;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'module:new',
    description: 'Scaffold a new module blueprint (v0.2).',
)]
final class ModuleNewCommand extends AbstractCommand
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
            'The module:new command is planned but not yet implemented.',
            [
                'v0.2 will scaffold the ~30 JSON manifests every module needs.',
                'It will register ULID prefixes and update the workspace module graph.',
                'The validator runs automatically before the command reports success.',
                'For now, copy an existing module under blueprints/ and adapt.',
            ],
        );

        return 0;
    }
}
