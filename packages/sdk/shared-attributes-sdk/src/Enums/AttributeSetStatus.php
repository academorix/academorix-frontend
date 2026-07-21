<?php

declare(strict_types=1);

namespace Stackra\SharedAttributesSdk\Enums;

/**
 * Wire-visible backed enum for `attribute-set.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category AttributesSdk
 *
 * @since    0.1.0
 */
enum AttributeSetStatus: string
{
    case Draft = 'draft';
    case Active = 'active';
    case Superseded = 'superseded';
    case Archived = 'archived';
}
