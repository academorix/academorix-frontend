<?php

declare(strict_types=1);

namespace Stackra\Versioning\Observers;

use Stackra\Versioning\Contracts\Data\DeprecationNoticeInterface;
use Stackra\Versioning\Events\DeprecationNoticePublished;
use Stackra\Versioning\Models\DeprecationNotice;

/**
 * Lifecycle side effects on {@see DeprecationNotice}.
 *
 * `created` — emit {@see DeprecationNoticePublished} when the row is
 * created already active. Draft notices (`is_active = false`) fire the
 * published event later, via the publish job.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
final class DeprecationNoticeObserver
{
    /**
     * `created` — emit the published event when the notice is active.
     */
    public function created(DeprecationNotice $notice): void
    {
        if ((bool) $notice->{DeprecationNoticeInterface::ATTR_IS_ACTIVE}) {
            DeprecationNoticePublished::dispatch($notice);
        }
    }
}
