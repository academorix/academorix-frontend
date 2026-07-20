<?php

declare(strict_types=1);

namespace Academorix\PlatformPublicSiteSdk\Enums;

/**
 * Wire-visible backed enum for `public-page.kind`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category PublicSiteSdk
 *
 * @since    0.1.0
 */
enum PublicPageKind: string
{
    case Page = 'page';
    case Landing = 'landing';
    case Post = 'post';
}
