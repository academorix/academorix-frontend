<?php

/**
 * @file helpers.php
 * @module Stackra\Cli
 * @description Global helper functions. Autoloaded via
 *   composer.json's `autoload.files`. Provides a Laravel-style `view()`
 *   helper for OmniTerm view rendering.
 *
 *   Full spec for the OmniTerm view bindings lives (or will live) in
 *   `.kiro/specs/utils-work/omniterm-tasks.md`.
 */

declare(strict_types=1);

use Illuminate\Contracts\View\Factory as ViewFactory;
use Illuminate\Contracts\View\View;

if (! function_exists('view')) {
    /**
     * Render a view through the Illuminate View factory bound onto the
     * CLI container by {@see \Stackra\Cli\Bootstrap\ViewBootstrapper}.
     *
     * Behaviour mirrors Laravel's global `view()` helper:
     * - `view()` returns the factory.
     * - `view($name)` returns a `View` renderable.
     * - `view($name, $data)` returns a `View` with data merged.
     *
     * @param  array<string, mixed>  $data
     */
    function view(?string $view = null, array $data = []): ViewFactory|View
    {
        $factory = \Stackra\Cli\Bootstrap\ViewBootstrapper::factory();
        if ($view === null) {
            return $factory;
        }

        return $factory->make($view, $data);
    }
}
