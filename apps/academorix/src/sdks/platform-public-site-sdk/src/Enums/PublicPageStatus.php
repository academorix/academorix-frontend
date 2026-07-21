<?php

declare(strict_types=1);

namespace Stackra\PlatformPublicSiteSdk\Enums;

/**
 * Wire-visible backed enum for `public-page.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category PublicSiteSdk
 *
 * @since    0.1.0
 */
enum PublicPageStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Archived = 'archived';
}
