<?php

declare(strict_types=1);

namespace Stackra\SharedAttributesSdk\Enums;

/**
 * Wire-visible backed enum for `attribute-definition.type`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category AttributesSdk
 *
 * @since    0.1.0
 */
enum AttributeDefinitionType: string
{
    case Integer = 'integer';
    case Decimal = 'decimal';
    case Select = 'select';
    case Boolean = 'boolean';
    case Date = 'date';
    case Text = 'text';
    case Slider = 'slider';
    case Percentage = 'percentage';
}
