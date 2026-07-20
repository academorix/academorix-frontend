<?php

declare(strict_types=1);

/**
 * Base Command.
 *
 * Abstract base class for all Academorix console commands. Uses OmniTerm
 * for rich terminal output with animated spinners, live tasks, progress
 * bars, and Tailwind-styled HTML rendering.
 *
 * @category Console
 *
 * @since    2.0.0
 */

namespace Academorix\Console\Commands;

use Academorix\Console\Concerns\UsesOmniTerm;
use Illuminate\Console\Command;
use Academorix\Console\Registry\CommandExtensionRegistry;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Base command with OmniTerm output, AOP hooks, and extension support.
 *
 * ## Usage:
 * ```php
 * #[AsCommand(name: 'my:command', description: 'My command')]
 * class MyCommand extends BaseCommand
 * {
 *     public function handle(): int
 *     {
 *         $this->omni->titleBar('My Command v1.0', 'sky');
 *
 *         $result = $this->omni->task('Processing...', function () {
 *             // work
 *             return ['state' => 'success', 'message' => 'Done'];
 *         });
 *
 *         $this->omni->success('Complete');
 *         return self::SUCCESS;
 *     }
 * }
 * ```
 */
abstract class BaseCommand extends Command
{
    // The trait chain (UsesOmniTerm -> HasOmniTerm) contributes an
    // `initialize()` method that sets `$this->omni`. Because we also
    // override `initialize()` on this class, the trait's method would
    // be shadowed and `$this->omni` would never be set. Aliasing the
    // trait method as `bootOmniTerm()` keeps it callable so our
    // override can delegate to it explicitly. `parent::` does NOT
    // reach a trait — traits are stitched into the class at compile
    // time, they are not part of the parent chain.
    use UsesOmniTerm {
        initialize as bootOmniTerm;
    }

    /**
     * Command start time for duration tracking.
     */
    protected float $commandStartTime;

    /**
     * Cached extension registry instance (lazy-loaded).
     */
    protected ?CommandExtensionRegistry $extensionRegistry = null;

    /**
     * Initialize the command — starts the duration timer, then
     * delegates to the aliased trait method which sets `$this->omni`
     * and calls `parent::initialize(...)` for us.
     *
     * Symfony Console invokes this hook automatically before
     * `execute()` runs, so every `handle()` body can call
     * `$this->omni->…` safely.
     */
    protected function initialize(InputInterface $input, OutputInterface $output): void
    {
        $this->commandStartTime = hrtime(true);
        $this->bootOmniTerm($input, $output);
    }

    /**
     * Execute the console command with AOP hooks.
     */
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        // Before hook
        if (method_exists($this, 'before') && (new \ReflectionMethod($this, 'before'))->getDeclaringClass()->getName() !== self::class) {
            $this->before($input, $output);
        }

        // Main execution
        $exitCode = parent::execute($input, $output);

        // After hook
        if (method_exists($this, 'after') && (new \ReflectionMethod($this, 'after'))->getDeclaringClass()->getName() !== self::class) {
            $this->after($exitCode, $input, $output);
        }

        return $exitCode;
    }

    // ══════════════════════════════════════════════════════════════════════
    // DURATION
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Show command execution duration.
     */
    protected function showDuration(): void
    {
        $ms = (hrtime(true) - $this->commandStartTime) / 1_000_000;
        $formatted = $ms < 1000 ? round($ms) . 'ms' : round($ms / 1000, 2) . 's';
        $this->omni->render("<div class=\"ml-1 text-zinc-500\">Completed in {$formatted}</div>");
    }

    // ══════════════════════════════════════════════════════════════════════
    // EXTENSIONS
    // ══════════════════════════════════════════════════════════════════════

    protected function registry(): CommandExtensionRegistry
    {
        if (! $this->extensionRegistry instanceof CommandExtensionRegistry) {
            $this->extensionRegistry = $this->laravel->make(CommandExtensionRegistry::class);
        }

        return $this->extensionRegistry;
    }

    protected function extensions(): array
    {
        return $this->registry()->getExtensionsFor($this->getName());
    }

    protected function hasExtensions(): bool
    {
        return $this->extensions() !== [];
    }

    protected function extensionCount(): int
    {
        return \count($this->extensions());
    }

    // ══════════════════════════════════════════════════════════════════════
    // AOP HOOKS
    // ══════════════════════════════════════════════════════════════════════

    protected function before(InputInterface $input, OutputInterface $output): void {}

    protected function after(int $exitCode, InputInterface $input, OutputInterface $output): void {}
}
