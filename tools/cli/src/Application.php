<?php

/**
 * @file Application.php
 * @module Academorix\Cli
 * @description Symfony Console application entry point for the Academorix CLI.
 *   Owns the DI container, registers every command, and delegates rendering to
 *   Symfony Console. Concrete commands read services out of the container in
 *   their constructor via {@see Container::resolve()}.
 */

declare(strict_types=1);

namespace Academorix\Cli;

use Academorix\Cli\Commands\CatalogListCommand;
use Academorix\Cli\Commands\CatalogSearchCommand;
use Academorix\Cli\Commands\ComposerSyncCommand;
use Academorix\Cli\Commands\MakeActionCommand;
use Academorix\Cli\Commands\MakeModelCommand;
use Academorix\Cli\Commands\MakeNativeScreenCommand;
use Academorix\Cli\Commands\MakePageCommand;
use Academorix\Cli\Commands\ModuleGenerateCommand;
use Academorix\Cli\Commands\ModuleNewCommand;
use Academorix\Cli\Commands\NewProjectCommand;
use Academorix\Cli\Commands\PackageAddCommand;
use Symfony\Component\Console\Application as SymfonyApplication;
use Symfony\Component\Console\Command\Command;

/**
 * Root Symfony Console application.
 */
final class Application extends SymfonyApplication
{
    public const NAME = 'Academorix CLI';

    public const VERSION = '0.1.0';

    /**
     * The workspace-scoped DI container. Every command receives a reference
     * to this container in its constructor so trait code can resolve
     * services on demand.
     */
    private readonly Container $container;

    public function __construct()
    {
        parent::__construct(self::NAME, self::VERSION);

        $this->container = new Container;

        foreach ($this->buildCommands() as $command) {
            $this->add($command);
        }
    }

    /**
     * Expose the container so command traits can resolve services on demand.
     */
    public function container(): Container
    {
        return $this->container;
    }

    /**
     * Instantiate every command with a container reference.
     *
     * @return array<int, Command>
     */
    private function buildCommands(): array
    {
        return [
            new NewProjectCommand($this->container),
            new MakeActionCommand($this->container),
            new CatalogListCommand($this->container),
            new CatalogSearchCommand($this->container),
            new ComposerSyncCommand($this->container),
            new PackageAddCommand($this->container),
            new ModuleNewCommand($this->container),
            new ModuleGenerateCommand($this->container),
            new MakeModelCommand($this->container),
            new MakePageCommand($this->container),
            new MakeNativeScreenCommand($this->container),
        ];
    }
}
