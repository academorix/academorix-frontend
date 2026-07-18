<?php

declare(strict_types=1);

/**
 * Parsed Output
 *
 * Support class providing Parsed Output utilities for the Omniterm module.
 * Contains helper logic used across multiple components in this module.
 *
 * @category Support
 *
 * @since    1.0.0
 */
namespace Academorix\OmniTerm\Rendering;

use Symfony\Component\Console\Output\ConsoleOutput;
use Symfony\Component\Console\Output\OutputInterface;

class ParsedOutput
{
    public function __construct(
        protected string $ansi,
        protected ?OutputInterface $output = null,
    ) {}

    public function toString(): string
    {
        return $this->ansi;
    }

    public function render(int $options = OutputInterface::OUTPUT_NORMAL): void
    {
        $output = $this->output ?? new ConsoleOutput;
        $output->writeln($this->ansi, $options);
    }
}
