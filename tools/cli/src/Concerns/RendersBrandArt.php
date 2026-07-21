<?php

/**
 * @file RendersBrandArt.php
 * @module Stackra\Cli\Concerns
 * @description Renders the STACKRA ASCII banner at the top of interactive
 *   command runs. Picks a gradient palette at random from
 *   {@see \Stackra\Cli\Support\Palette} and applies it per line.
 */

declare(strict_types=1);

namespace Stackra\Cli\Concerns;

use Stackra\Cli\Support\Gradient;
use Stackra\Cli\Support\Palette;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Composed by every command through {@see \Stackra\Cli\Commands\AbstractCommand}.
 */
trait RendersBrandArt
{
    /**
     * Six figlet-style lines that spell STACKRA in block letters.
     *
     * @var list<string>
     */
    private array $brandArtLines = [
        '    _    ____    _    ____  _____ __  __  ___  ____  _____  __',
        '   / \  / ___|  / \  |  _ \| ____|  \/  |/ _ \|  _ \|_ _\ \/ /',
        '  / _ \| |     / _ \ | | | |  _| | |\/| | | | | |_) || | \  / ',
        ' / ___ \ |___ / ___ \| |_| | |___| |  | | |_| |  _ < | | /  \ ',
        '/_/   \_\____/_/   \_\____/|_____|_|  |_|\___/|_| \_\___/_/\_\\',
        '',
    ];

    public function renderBrandArt(OutputInterface $output): void
    {
        $palette = Palette::random();
        $lines = $this->brandArtLines;

        foreach ($lines as $i => $line) {
            $color = $palette[$i] ?? $palette[array_key_last($palette)];
            $output->writeln(Gradient::fg256($color).$line.Gradient::reset());
        }

        $output->writeln('  <fg=gray>Stackra workspace CLI</> <fg=default;options=bold>v'.\Stackra\Cli\Application::VERSION.'</>');
        $output->writeln('');
    }
}
