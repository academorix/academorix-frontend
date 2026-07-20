<?php

declare(strict_types=1);

/**
 * Has Repository Events Contract
 *
 * Defines the contract for Has Repository Events implementations in the Framework module.
 * All concrete implementations must fulfill this interface to ensure consistent behavior.
 *
 * @category Contracts
 *
 * @since    1.0.0
 */
namespace Academorix\Crud\Contracts;

/**
 * Has Repository Events Interface.
 *
 * Repositories implementing this interface can opt-in to dispatching
 * EntityCreated, EntityUpdated, and EntityDeleted events on write operations.
 *
 * @since 2.0.0
 */
interface HasRepositoryEvents
{
    /**
     * Determine if repository events should be dispatched.
     *
     * @return bool True if events should be dispatched on write operations.
     */
    public function shouldDispatchRepositoryEvents(): bool;
}
