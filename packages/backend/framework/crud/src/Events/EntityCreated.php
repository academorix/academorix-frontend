<?php

declare(strict_types=1);

/**
 * Entity Created Event
 *
 * Domain event dispatched when Entity Created occurs in the Framework module.
 * Listeners can react to this event for side effects like notifications or logging.
 *
 * @category Events
 *
 * @since    1.0.0
 */
namespace Academorix\Crud\Events;

use Illuminate\Database\Eloquent\Model;

/**
 * Entity Created Event.
 *
 * Dispatched after a new entity is created via a repository.
 * Contains the repository class, the created model, and the attributes used.
 *
 * @since 2.0.0
 */
