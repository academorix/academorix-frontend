<?php

declare(strict_types=1);

/**
 * Entity Updated Event
 *
 * Domain event dispatched when Entity Updated occurs in the Framework module.
 * Listeners can react to this event for side effects like notifications or logging.
 *
 * @category Events
 *
 * @since    1.0.0
 */
namespace Stackra\Crud\Events;

use Illuminate\Database\Eloquent\Model;

/**
 * Entity Updated Event.
 *
 * Dispatched after an entity is updated via a repository.
 * Contains the repository class, the updated model, and the attributes changed.
 *
 * @since 2.0.0
 */
