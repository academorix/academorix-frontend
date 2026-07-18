<?php

declare(strict_types=1);

namespace Academorix\Storage\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * File visibility on the wire.
 *
 * ## Cases
 *
 *  * {@see self::Public}  — publicly reachable via CDN without a
 *    signed URL. Used for logos / avatars that appear on unauthenticated
 *    surfaces.
 *  * {@see self::Private} — requires a freshly-signed URL for every
 *    read. Default for anything under a tenant's private files.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum FileVisibility: string
{
    use Enum;

    #[Label('Public')]
    #[Description('Reachable via CDN without a signed URL. Suitable for logos / avatars.')]
    case Public = 'public';

    #[Label('Private')]
    #[Description('Requires a freshly-signed URL for every read. Default for tenant files.')]
    case Private = 'private';
}
