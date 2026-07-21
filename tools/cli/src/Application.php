<?php

/**
 * @file Application.php
 * @module Stackra\Cli
 * @description Symfony Console application entry point for the Stackra CLI.
 *   Owns the DI container, registers every command, and delegates rendering to
 *   Symfony Console. Concrete commands read services out of the container in
 *   their constructor via {@see Container::resolve()}.
 */

declare(strict_types=1);

namespace Stackra\Cli;

use Stackra\Cli\Commands\CatalogListCommand;
use Stackra\Cli\Commands\CatalogSearchCommand;
use Stackra\Cli\Commands\ComposerSyncCommand;
use Stackra\Cli\Commands\MakeActionCommand;
use Stackra\Cli\Commands\MakeModelCommand;
use Stackra\Cli\Commands\MakeNativeScreenCommand;
use Stackra\Cli\Commands\MakePageCommand;
use Stackra\Cli\Commands\ModuleGenerateCommand;
use Stackra\Cli\Commands\ModuleNewCommand;
use Stackra\Cli\Commands\NewProjectCommand;
use Stackra\Cli\Commands\PackageAddCommand;
use Symfony\Component\Console\Application as SymfonyApplication;
use Symfony\Component\Console\Command\Command;

/**
 * Root Symfony Console application.
 */
final class Application extends SymfonyApplication
{
    public const NAME = 'Stackra CLI';

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
