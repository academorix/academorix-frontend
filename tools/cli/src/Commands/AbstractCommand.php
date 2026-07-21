<?php

/**
 * @file AbstractCommand.php
 * @module Stackra\Cli\Commands
 * @description Base class every concrete command extends. Composes all 14
 *   concern traits so a concrete command only has to implement
 *   {@see handle()}. Error handling, banner rendering, and input validation
 *   are all handled in {@see execute()} before delegating to the concrete.
 */

declare(strict_types=1);

namespace Stackra\Cli\Commands;

use Stackra\Cli\Concerns\HandlesErrors;
use Stackra\Cli\Concerns\RendersBrandArt;
use Stackra\Cli\Concerns\UsesBlueprint;
use Stackra\Cli\Concerns\UsesCatalog;
use Stackra\Cli\Concerns\UsesComposer;
use Stackra\Cli\Concerns\UsesFilesystem;
use Stackra\Cli\Concerns\UsesFormatters;
use Stackra\Cli\Concerns\UsesGit;
use Stackra\Cli\Concerns\UsesLaravelPrompts;
use Stackra\Cli\Concerns\UsesOmniTerm;
use Stackra\Cli\Concerns\UsesPnpm;
use Stackra\Cli\Concerns\UsesStubs;
use Stackra\Cli\Concerns\UsesTemplates;
use Stackra\Cli\Concerns\ValidatesInput;
use Stackra\Cli\Container;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Throwable;

/**
 * Base command that composes every workspace concern. Concrete commands
 * inherit every trait; there is no opt-in.
 */
abstract class AbstractCommand extends Command
{
    use HandlesErrors;
    use RendersBrandArt;
    use UsesBlueprint;
    use UsesCatalog;
    use UsesComposer;
    use UsesFilesystem;
    use UsesFormatters;
    use UsesGit;
    use UsesLaravelPrompts;
    use UsesOmniTerm;
    use UsesPnpm;
    use UsesStubs;
    use UsesTemplates;
    use ValidatesInput;

    /**
     * The workspace container. Available to every trait.
     */
    protected Container $container;

    public function __construct(Container $container)
    {
        parent::__construct();
        $this->container = $container;
    }

    /**
     * Every command accepts `--no-banner` to suppress the STACKRA banner
     * (useful in CI + programmatic invocations). Concrete commands should
     * call `parent::configure()` if they override.
     */
    protected function configure(): void
    {
        parent::configure();
        $this->addOption(
            'no-banner',
            null,
            InputOption::VALUE_NONE,
            'Suppress the STACKRA banner.',
        );
    }

    /**
     * Standard execute wraps the concrete's `handle()` in banner + error
     * rendering. Concrete commands never override this — they implement
     * `handle()` and let the trait stack do the framing.
     *
     * Trait initialisation happens BEFORE `execute()` via Symfony
     * Console's own `initialize()` hook, which `HasOmniTerm` composes.
     * By the time `handle()` runs, every `$this->omni` / `$this->foo`
     * accessor is safe to use.
     */
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        try {
            if ($this->shouldRenderBanner($input, $output)) {
                $this->renderBrandArt($output);
            }

            return $this->handle($input, $output);
        } catch (Throwable $e) {
            return $this->renderFatalError($e, $output);
        }
    }

    /**
     * Concrete implementation lives here. Traits are pre-initialised;
     * concrete commands can call `$this->omni`, `$this->askText(...)`,
     * `$this->catalog()`, etc. directly.
     */
    abstract protected function handle(InputInterface $input, OutputInterface $output): int;

    /**
     * The banner renders only in decorated terminals and when the caller
     * hasn't set --no-banner. CI + piped output skips it automatically.
     */
    protected function shouldRenderBanner(InputInterface $input, OutputInterface $output): bool
    {
        if ($input->getOption('no-banner')) {
            return false;
        }

        return $output->isDecorated();
    }
}
