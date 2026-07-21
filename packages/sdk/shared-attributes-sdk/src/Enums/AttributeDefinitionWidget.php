<?php

declare(strict_types=1);

namespace Stackra\SharedAttributesSdk\Enums;

/**
 * Wire-visible backed enum for `attribute-definition.widget`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category AttributesSdk
 *
 * @since    0.1.0
 */
enum AttributeDefinitionWidget: string
{
    case Select = 'select';
    case Slider = 'slider';
    case Number = 'number';
    case Date = 'date';
    case Input = 'input';
    case Switch = 'switch';
    case Textarea = 'textarea';
    case Radio = 'radio';
}
