<?php

/**
 * @file AbstractCommand.php
 * @module Academorix\Cli\Commands
 * @description Base class every concrete command extends. Composes all 14
 *   concern traits so a concrete command only has to implement
 *   {@see handle()}. Error handling, banner rendering, and input validation
 *   are all handled in {@see execute()} before delegating to the concrete.
 */

declare(strict_types=1);

namespace Academorix\Cli\Commands;

use Academorix\Cli\Concerns\HandlesErrors;
use Academorix\Cli\Concerns\RendersBrandArt;
use Academorix\Cli\Concerns\UsesBlueprint;
use Academorix\Cli\Concerns\UsesCatalog;
use Academorix\Cli\Concerns\UsesComposer;
use Academorix\Cli\Concerns\UsesFilesystem;
use Academorix\Cli\Concerns\UsesFormatters;
use Academorix\Cli\Concerns\UsesGit;
use Academorix\Cli\Concerns\UsesLaravelPrompts;
use Academorix\Cli\Concerns\UsesOmniTerm;
use Academorix\Cli\Concerns\UsesPnpm;
use Academorix\Cli\Concerns\UsesStubs;
use Academorix\Cli\Concerns\UsesTemplates;
use Academorix\Cli\Concerns\ValidatesInput;
use Academorix\Cli\Container;
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
     * Every command accepts `--no-banner` to suppress the ACADEMORIX banner
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
            'Suppress the ACADEMORIX banner.',
        );
    }

    /**
     * Standard execute wraps the concrete's `handle()` in banner + error
     * rendering. Concrete commands never override this — they implement
     * `handle()` and let the trait stack do the framing.
     */
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        try {
            $this->initializeConcerns($input, $output);

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
     * Trait initialisation hook. Called before {@see handle()}. Each trait
     * that needs state (currently only `UsesOmniTerm`) populates itself
     * here.
     */
    protected function initializeConcerns(InputInterface $input, OutputInterface $output): void
    {
        $this->bootUsesOmniTerm($output);
    }

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
