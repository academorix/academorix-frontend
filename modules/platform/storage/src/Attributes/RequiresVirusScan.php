<?php

declare(strict_types=1);

namespace Academorix\Storage\Attributes;

use Attribute;

/**
 * Pin virus scanning ON for this attachment / kind explicitly.
 *
 * The default is already `true` for every kind; this attribute is
 * used to make the intent visible in code review and to override
 * a `#[FileKind(requiresVirusScan: false)]` on a nested consumer.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_PROPERTY)]
final readonly class RequiresVirusScan
{
    public function __construct()
    {
    }
}
