<?php

declare(strict_types=1);

/**
 * Has Omni Term Trait
 *
 * Provides Omni Term capabilities to models and classes that use this trait.
 * Encapsulates reusable Omni Term logic for the Omniterm module.
 *
 * @category Concerns
 *
 * @since    1.0.0
 */
namespace Academorix\OmniTerm\Concerns;

use Academorix\OmniTerm\OmniTerm;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Provides OmniTerm access on any Artisan command.
 *
 * Initializes `$this->omni` during the command's `initialize()` phase.
 *
 * @property-read OmniTerm $omni
 */
trait HasOmniTerm
{
    public OmniTerm $omni;

    protected function initialize(InputInterface $input, OutputInterface $output): void
    {
        $this->omni = new OmniTerm();
        parent::initialize($input, $output);
    }
}
