<?php

/**
 * @file RendersBrandArt.php
 * @module Academorix\Cli\Concerns
 * @description Renders the ACADEMORIX ASCII banner at the top of interactive
 *   command runs. Picks a gradient palette at random from
 *   {@see \Academorix\Cli\Support\Palette} and applies it per line.
 */

declare(strict_types=1);

namespace Academorix\Cli\Concerns;

use Academorix\Cli\Support\Gradient;
use Academorix\Cli\Support\Palette;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Composed by every command through {@see \Academorix\Cli\Commands\AbstractCommand}.
 */
trait RendersBrandArt
{
    /**
     * Six figlet-style lines that spell ACADEMORIX in block letters.
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

        $output->writeln('  <fg=gray>Academorix workspace CLI</> <fg=default;options=bold>v'.\Academorix\Cli\Application::VERSION.'</>');
        $output->writeln('');
    }
}
