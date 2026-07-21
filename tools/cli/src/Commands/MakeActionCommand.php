<?php

/**
 * @file MakeActionCommand.php
 * @module Stackra\Cli\Commands
 * @description `stackra make:action <ClassName> --module=<tier/name>
 *   --verb=<Http> --route=<path>` — emits a single Laravel action from
 *   the `php.action` stub.
 */

declare(strict_types=1);

namespace Stackra\Cli\Commands;

use Stackra\Cli\Support\Console;
use Stackra\Cli\Support\PathResolver;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'make:action',
    description: 'Emit a single Laravel action from the php.action stub.',
)]
final class MakeActionCommand extends AbstractCommand
{
    protected function configure(): void
    {
        parent::configure();
        $this->addArgument('name', InputArgument::REQUIRED, 'Action class name (PascalCase).');
        $this->addOption('module', 'm', InputOption::VALUE_REQUIRED, 'Module identifier <tier/name>.');
        $this->addOption('verb', null, InputOption::VALUE_REQUIRED, 'HTTP verb (Get/Post/Put/Patch/Delete).', 'Post');
        $this->addOption('route', null, InputOption::VALUE_REQUIRED, 'Route path (e.g. /api/v1/foo).');
    }

    protected function handle(InputInterface $input, OutputInterface $output): int
    {
        $className = (string) $input->getArgument('name');
        $module = (string) ($input->getOption('module') ?? '');
        $verb = (string) $input->getOption('verb');
        $route = Console::opt($input, 'route');

        $this->assertValidModuleName($module);

        $resolver = $this->container->resolve(PathResolver::class);
        $workspaceRoot = $resolver->workspaceRoot();

        [$tier, $slug] = explode('/', $module, 2);
        $moduleDir = sprintf('%s/packages/backend/%s/%s', $workspaceRoot, $tier, $slug);
        $this->assertDirectoryExists($moduleDir);

        $namespace = sprintf('Stackra\\%s\\%s\\Actions', $this->pascal($tier), $this->pascal($slug));
        $outputPath = sprintf('%s/src/Actions/%s.php', $moduleDir, $className);

        $tokens = [
            'namespace' => $namespace,
            'class' => $className,
            'verb' => $verb,
            'route' => $route ?? '/',
            'routeName' => $this->routeName($className),
            'summary' => sprintf('Handle %s.', $this->humanize($className)),
            'moduleName' => $module,
            'tier' => $tier,
            'date' => date('Y-m-d'),
            'version' => \Stackra\Cli\Application::VERSION,
        ];

        if (! $this->container->resolve(\Stackra\Cli\Stubs\StubRegistry::class)->has('php.action')) {
            $this->omni->statusError(
                'Stub not registered',
                'The php.action stub is not in StubRegistry::defaultStubs() yet.',
                [
                    'Populate the registry per .kiro/specs/utils-work/stubs-tasks.md.',
                    'The 69-stub bundle is a separate deliverable landed alongside this CLI.',
                ],
            );

            return 3;
        }

        $this->renderStub('php.action', $outputPath, $tokens);

        $this->omni->statusSuccess(
            'Action created',
            sprintf('%s\\%s', $namespace, $className),
            [
                sprintf('File: %s', $outputPath),
                'Next: write a Pest feature test alongside the action.',
                'Next: verify the route mount in your module\'s ServiceProvider.',
            ],
        );

        return 0;
    }

    private function pascal(string $s): string
    {
        return str_replace(' ', '', ucwords(str_replace(['-', '_'], ' ', $s)));
    }

    private function routeName(string $className): string
    {
        return strtolower(preg_replace('/[A-Z]/', '.$0', lcfirst($className)) ?? $className);
    }

    private function humanize(string $className): string
    {
        return strtolower(trim(preg_replace('/[A-Z]/', ' $0', $className) ?? $className));
    }
}
