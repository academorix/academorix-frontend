<?php

/**
 * @file packages/foundation/src/Contracts/Correlatable.php
 *
 * @description
 * Contract for anything that carries a correlation / request id — the
 * short-lived opaque string that stitches together every log line,
 * span, and exception belonging to a single request. Exceptions
 * implement this so the JSON renderer can echo the id back to the
 * caller and reporters can tag Sentry / Datadog events with it.
 */

declare(strict_types=1);

namespace Stackra\Foundation\Contracts;

interface Correlatable
{
    /**
     * The correlation id, or `null` if none was captured.
     */
    public function correlationId(): ?string;
}
