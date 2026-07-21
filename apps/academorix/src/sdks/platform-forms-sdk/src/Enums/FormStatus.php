<?php

declare(strict_types=1);

namespace Stackra\PlatformFormsSdk\Enums;

/**
 * Wire-visible backed enum for `form.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category FormsSdk
 *
 * @since    0.1.0
 */
enum FormStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Archived = 'archived';
}
