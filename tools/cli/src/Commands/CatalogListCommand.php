<?php

/**
 * @file CatalogListCommand.php
 * @module Academorix\Cli\Commands
 * @description `academorix catalog:list [--tier=<t>] [--surface=<s>]` —
 *   lists every catalogue entry, optionally filtered by tier or surface.
 */

declare(strict_types=1);

namespace Academorix\Cli\Commands;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'catalog:list',
    description: 'List every catalog entry, optionally filtered by tier or surface.',
)]
final class CatalogListCommand extends AbstractCommand
{
    protected function configure(): void
    {
        parent::configure();
        $this->addOption('tier', null, InputOption::VALUE_REQUIRED, 'Filter by tier (foundation/framework/saas/domain).');
        $this->addOption('surface', null, InputOption::VALUE_REQUIRED, 'Filter by surface (core/react/native/testing).');
    }

    protected function handle(InputInterface $input, OutputInterface $output): int
    {
        $tier = $input->getOption('tier');
        $surface = $input->getOption('surface');

        $entries = $this->catalog()->all();

        if (is_string($tier) && $tier !== '') {
            $entries = array_values(array_filter($entries, static fn ($e) => $e->tier === $tier));
        }
        if (is_string($surface) && $surface !== '') {
            $entries = array_values(array_filter($entries, static fn ($e) => in_array($surface, $e->surfaces, true)));
        }

        $this->omni->titleBar(sprintf('Catalog — %d %s', count($entries), count($entries) === 1 ? 'entry' : 'entries'));

        if ($entries === []) {
            $this->omni->statusInfo('No entries', 'Nothing matched the given filters.');

            return 0;
        }

        $this->omni->tableHeader('Tier', 'Package', 'Purpose');
        foreach ($entries as $entry) {
            $this->omni->tableRow(
                $entry->tier,
                $entry->name,
                mb_strimwidth($entry->purpose, 0, 60, '...'),
            );
        }

        return 0;
    }
}
