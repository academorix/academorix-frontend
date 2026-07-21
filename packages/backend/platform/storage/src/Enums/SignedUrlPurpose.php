<?php

declare(strict_types=1);

namespace Stackra\Storage\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Reason a signed URL was issued.
 *
 * Drives the per-purpose TTL policy in `config/storage.php` under
 * `signed_urls.ttl_policy` — download / preview / share /
 * admin_action / export / notification_attachment. See module.json
 * §signed_urls.
 *
 * ## Cases
 *
 *  * {@see self::Download}               — user-initiated file download.
 *  * {@see self::Preview}                — inline preview (short TTL).
 *  * {@see self::Share}                  — external share link (longest TTL).
 *  * {@see self::AdminAction}            — platform-admin one-time IP-locked URL.
 *  * {@see self::Export}                 — background export artefact.
 *  * {@see self::NotificationAttachment} — attached to an outbound notification.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum SignedUrlPurpose: string
{
    use Enum;

    #[Label('Download')]
    #[Description('User-initiated file download. Default 1 hour TTL.')]
    case Download = 'download';

    #[Label('Preview')]
    #[Description('Inline preview (thumbnail, image render). Short TTL — meant to be renewed.')]
    case Preview = 'preview';

    #[Label('Share')]
    #[Description('External share link. Longest TTL, tenant-admin permission required.')]
    case Share = 'share';

    #[Label('Admin Action')]
    #[Description('Platform admin one-time IP-locked URL. Short TTL.')]
    case AdminAction = 'admin_action';

    #[Label('Export')]
    #[Description('Background export artefact link. TTL matches the export retention.')]
    case Export = 'export';

    #[Label('Notification Attachment')]
    #[Description('Attached to an outbound notification (email attachment link).')]
    case NotificationAttachment = 'notification_attachment';
}
