<?php

/**
 * @file PackageAddCommand.php
 * @module Stackra\Cli\Commands
 * @description `stackra package:add <name>` — v0.1 placeholder.
 *   v0.2 resolves `<name>` against the catalog and installs via composer
 *   or pnpm; wires ServiceProvider / AppModule registration.
 */

declare(strict_types=1);

namespace Stackra\Cli\Commands;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'package:add',
    description: 'Install a package from the workspace catalog (v0.2).',
)]
final class PackageAddCommand extends AbstractCommand
{
    protected function configure(): void
    {
        parent::configure();
        $this->addArgument('name', InputArgument::REQUIRED, 'Catalog package name (e.g. stackra/audit).');
    }

    protected function handle(InputInterface $input, OutputInterface $output): int
    {
        $this->omni->statusSuccess(
            'Coming in v0.2.0',
            'The package:add command is planned but not yet implemented.',
            [
                'v0.2 will resolve <name> against the workspace catalog.',
                'It will then install via composer (backend) or pnpm (frontend/native).',
                'ServiceProvider / AppModule registration is wired automatically.',
                'For now, add packages by hand and reference their catalog.json.',
            ],
        );

        return 0;
    }
}
