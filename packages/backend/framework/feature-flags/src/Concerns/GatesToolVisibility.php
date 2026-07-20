<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Concerns;

/**
 * Attach to any AI tool class to gate its visibility behind a feature flag.
 *
 * `SensitiveTool` / `WritableTool` in `apps/ai-service` compose
 * this trait. At persona-bootstrap time the tool-registry pipeline
 * calls `requiresFeature()` and asks `FeatureCheckerInterface`
 * whether the flag is active. Fail-closed: a checker exception
 * hides the tool rather than surfacing it optimistically.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
trait GatesToolVisibility
{
    /**
     * Return the flag name that gates this tool.
     *
     * Consumers override with a concrete flag name; the default
     * returns `null` (tool is always visible).
     *
     * @return string|null  Flag name, or `null` for always-visible tools.
     */
    public function requiresFeature(): ?string
    {
        return null;
    }
}
