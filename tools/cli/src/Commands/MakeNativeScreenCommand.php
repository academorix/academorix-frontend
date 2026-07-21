<?php

/**
 * @file MakeNativeScreenCommand.php
 * @module Stackra\Cli\Commands
 * @description `stackra make:native-screen <name> --domain=<x>` —
 *   v0.1 placeholder. v0.2 emits a heroui-native-pro screen wired
 *   through Expo Router.
 */

declare(strict_types=1);

namespace Stackra\Cli\Commands;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'make:native-screen',
    description: 'Emit a HeroUI Native screen wired through Expo Router (v0.2).',
)]
final class MakeNativeScreenCommand extends AbstractCommand
{
    protected function configure(): void
    {
        parent::configure();
        $this->addArgument('name', InputArgument::REQUIRED, 'Screen name (PascalCase).');
        $this->addOption('domain', null, InputOption::VALUE_REQUIRED, 'Domain slug (kebab-case).');
    }

    protected function handle(InputInterface $input, OutputInterface $output): int
    {
        $this->omni->statusSuccess(
            'Coming in v0.2.0',
            'The make:native-screen command is planned but not yet implemented.',
            [
                'v0.2 emits a heroui-native-pro screen with Uniwind classes.',
                'Wires the screen into the Expo Router file-system route automatically.',
                'For now, hand-scaffold from the native.screen stub when the stub bundle lands.',
            ],
        );

        return 0;
    }
}
