<?php

declare(strict_types=1);

namespace Academorix\PlatformFormsSdk\Enums;

/**
 * Wire-visible backed enum for `form-version.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category FormsSdk
 *
 * @since    0.1.0
 */
enum FormVersionStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Superseded = 'superseded';
    case Archived = 'archived';
}
