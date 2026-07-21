<?php

/**
 * @file CatalogSearchCommand.php
 * @module Stackra\Cli\Commands
 * @description `stackra catalog:search <query> [--tier=<t>]` — searches
 *   the catalogue by capability substring across purpose + capabilities.
 */

declare(strict_types=1);

namespace Stackra\Cli\Commands;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'catalog:search',
    description: 'Search the workspace catalog by capability substring.',
)]
final class CatalogSearchCommand extends AbstractCommand
{
    protected function configure(): void
    {
        parent::configure();
        $this->addArgument('query', InputArgument::REQUIRED, 'Capability substring to search for.');
        $this->addOption('tier', null, InputOption::VALUE_REQUIRED, 'Filter by tier.');
    }

    protected function handle(InputInterface $input, OutputInterface $output): int
    {
        $query = strtolower((string) $input->getArgument('query'));
        $tier = $input->getOption('tier');

        $matches = array_values(array_filter(
            $this->catalog()->all(),
            static function ($entry) use ($query, $tier): bool {
                if (is_string($tier) && $tier !== '' && $entry->tier !== $tier) {
                    return false;
                }
                if (str_contains(strtolower($entry->purpose), $query)) {
                    return true;
                }
                foreach ($entry->capabilities as $cap) {
                    if (str_contains(strtolower($cap), $query)) {
                        return true;
                    }
                }

                return false;
            },
        ));

        if ($matches === []) {
            $this->omni->statusError(
                'No matches',
                sprintf('No catalog entry matched "%s".', $query),
                [
                    'Try a broader search term.',
                    'Run `stackra catalog:list` to see every known package.',
                ],
            );

            return 2;
        }

        $this->omni->titleBar(sprintf('Catalog — %d match(es) for "%s"', count($matches), $query));
        $this->omni->tableHeader('Tier', 'Package', 'Purpose');
        foreach ($matches as $entry) {
            $this->omni->tableRow(
                $entry->tier,
                $entry->name,
                mb_strimwidth($entry->purpose, 0, 60, '...'),
            );
        }

        return 0;
    }
}
