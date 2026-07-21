<?php

/**
 * @file MakePageCommand.php
 * @module Stackra\Cli\Commands
 * @description `stackra make:page <resource> --domain=<name>` — v0.1
 *   placeholder. v0.2 emits a Refine page set (list + create + edit +
 *   show + columns + form + module manifest).
 */

declare(strict_types=1);

namespace Stackra\Cli\Commands;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'make:page',
    description: 'Emit a Refine page set (list + create + edit + show) (v0.2).',
)]
final class MakePageCommand extends AbstractCommand
{
    protected function configure(): void
    {
        parent::configure();
        $this->addArgument('resource', InputArgument::REQUIRED, 'Refine resource name (kebab-case).');
        $this->addOption('domain', null, InputOption::VALUE_REQUIRED, 'Domain slug (kebab-case).');
    }

    protected function handle(InputInterface $input, OutputInterface $output): int
    {
        $this->omni->statusSuccess(
            'Coming in v0.2.0',
            'The make:page command is planned but not yet implemented.',
            [
                'v0.2 emits Refine list/create/edit/show pages plus a shared form + column set.',
                'Wires the resource into the domain module manifest automatically.',
                'For now, hand-scaffold the pages from the react.page-* stubs.',
            ],
        );

        return 0;
    }
}
