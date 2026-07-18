<?php

declare(strict_types=1);

/**
 * Terminal
 *
 * Support class providing Terminal utilities for the Omniterm module.
 * Contains helper logic used across multiple components in this module.
 *
 * @category Support
 *
 * @since    1.0.0
 */
namespace Academorix\OmniTerm\Rendering;

use Symfony\Component\Console\Terminal as SymfonyTerminal;

class Terminal
{
    protected SymfonyTerminal $terminal;

    public function __construct()
    {
        $this->terminal = new SymfonyTerminal;
    }

    public function getWidth(): int
    {
        return $this->terminal->getWidth();
    }

    public function getHeight(): int
    {
        return $this->terminal->getHeight();
    }
}
