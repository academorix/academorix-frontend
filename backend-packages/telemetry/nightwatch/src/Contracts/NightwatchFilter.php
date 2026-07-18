<?php

declare(strict_types=1);

/**
 * Nightwatch Filter Contract.
 *
 * Filters determine whether a specific event should be excluded
 * from Nightwatch collection. Return true to reject the event.
 *
 * @category Contracts
 *
 * @since    1.0.0
 */

namespace Academorix\Nightwatch\Contracts;

/**
 * Nightwatch Filter Contract.
 *
 * Filters determine whether a specific event should be excluded
 * from Nightwatch collection. Return true to reject the event.
 */
interface NightwatchFilter
{
    /**
     * Determine if the event record should be rejected.
     *
     * @param mixed $record The Nightwatch record (Query, CacheEvent, QueuedJob, etc.)
     *
     * @return bool True to reject/exclude the event
     */
    public function reject(mixed $record): bool;
}
