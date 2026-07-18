<?php

declare(strict_types=1);

/**
 * Renderer Reset Handler.
 *
 * Octane lifecycle handler that clears the `Renderer::$staticOutput`
 * reference between requests. Without this reset, a test or console
 * command that calls `Renderer::renderUsing($output)` would leave
 * the static reference pointing at a stale `OutputInterface` —
 * subsequent HTTP requests on the same worker would write to the
 * wrong output stream.
 *
 * Runs at priority 5 (same tier as other static-state resets).
 *
 * @category Handlers
 *
 * @since    1.0.0
 *
 * @see \Academorix\OmniTerm\Rendering\Renderer::renderUsing()
 */

namespace Academorix\OmniTerm\Handlers;

use Illuminate\Container\Attributes\Singleton;
use Academorix\Octane\Attributes\OnRequestReceived;
use Academorix\Octane\Contracts\OctaneHandlerInterface;
use Academorix\OmniTerm\Rendering\Renderer;

/**
 * Resets the OmniTerm renderer's static output between Octane requests.
 *
 * Priority 5 ensures this runs early — after scoped-instance flush
 * (priority 1) but before any command or middleware that might render
 * terminal output.
 */
#[OnRequestReceived(priority: 5)]
#[Singleton]
class RendererResetHandler implements OctaneHandlerInterface
{
    /**
     * Handle the RequestReceived event.
     *
     * Nulls the static output reference so the next render call
     * falls back to a fresh `ConsoleOutput` instance.
     *
     * @param  object  $event  The Octane RequestReceived event.
     */
    public function handle(object $event): void
    {
        Renderer::renderUsing(null);
    }
}
