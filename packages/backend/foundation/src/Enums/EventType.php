<?php

declare(strict_types=1);

/**
 * Event Type Enumeration
 *
 * Defines the set of allowed values for Event Type within the Foundation module.
 * Supported values include: SAVE, DELETE, LOAD, MASS_DELETE.
 *
 * @category Enums
 *
 * @since    1.0.0
 */
namespace Stackra\Foundation\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Enum;

/**
 * Enum representing common model actions/events.
 * Used to define events that can occur on models such as saving, loading, deleting, etc.
 *
 * @method static SAVE() Returns the SAVE enum instance
 * @method static DELETE() Returns the DELETE enum instance
 * @method static LOAD() Returns the LOAD enum instance
 * @method static MASS_DELETE() Returns the MASS_DELETE enum instance
 * @method static DUPLICATE() Returns the DUPLICATE enum instance
 */
enum EventType: string
{
    use Enum;

    /**
     * Saving the model.
     * Triggered when an model is about to be saved to the database.
     */
    #[Label('Save')]
    #[Description('Triggered when an model is about to be saved to the database.')]
    case SAVE = 'save';

    /**
     * Deleting the model.
     * Triggered when an model is about to be deleted from the database.
     */
    #[Label('Delete')]
    #[Description('Triggered when an model is about to be deleted from the database.')]
    case DELETE = 'delete';

    /**
     * Loading the model.
     * Triggered when an model is being loaded from the database.
     */
    #[Label('Load')]
    #[Description('Triggered when an model is being loaded from the database.')]
    case LOAD = 'load';

    /**
     * Mass-deleting models.
     * Triggered when a set of models are about to be deleted in bulk.
     */
    #[Label('Mass Delete')]
    #[Description('Triggered when a set of models are about to be deleted in bulk.')]
    case MASS_DELETE = 'mass_delete';

    /**
     * Duplicating the model.
     * Triggered when an model is being duplicated.
     */
    #[Label('Duplicate')]
    #[Description('Triggered when an model is being duplicated.')]
    case DUPLICATE = 'duplicate';
}
