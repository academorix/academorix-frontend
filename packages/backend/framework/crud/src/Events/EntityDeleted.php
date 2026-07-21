<?php

declare(strict_types=1);

/**
 * Entity Deleted Event
 *
 * Domain event dispatched when Entity Deleted occurs in the Framework module.
 * Listeners can react to this event for side effects like notifications or logging.
 *
 * @category Events
 *
 * @since    1.0.0
 */
namespace Stackra\Crud\Events;

use Illuminate\Database\Eloquent\Model;

/**
 * Entity Deleted Event.
 *
 * Dispatched after an entity is deleted via a repository.
 * Contains the repository class, the deleted model, and an empty attributes array.
 *
 * @since 2.0.0
 */
