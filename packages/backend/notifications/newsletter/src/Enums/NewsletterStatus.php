<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Lifecycle state of a {@see \Stackra\Newsletter\Models\Newsletter}.
 *
 * ## Cases
 *
 *  * {@see self::Draft}     — new publication, not yet accepting subscribers.
 *  * {@see self::Active}    — accepting subscribers + able to send issues.
 *  * {@see self::Paused}    — manually paused; new campaigns refuse to start.
 *  * {@see self::Throttled} — auto-paused by the reputation monitor after
 *    consecutive threshold breaches. Requires explicit admin review to
 *    move back to `Active`.
 *  * {@see self::Archived}  — retired publication; read-only.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum NewsletterStatus: string
{
    use Enum;

    /**
     * Draft — new publication, not yet accepting subscribers.
     */
    #[Label('Draft')]
    #[Description('New publication that is not yet accepting subscribers.')]
    case Draft = 'draft';

    /**
     * Active — dispatching campaigns normally.
     */
    #[Label('Active')]
    #[Description('Publication is active — accepting subscribers and sending issues.')]
    case Active = 'active';

    /**
     * Paused — manually paused by an admin.
     */
    #[Label('Paused')]
    #[Description('Manually paused by an admin. New campaigns refuse to start until resumed.')]
    case Paused = 'paused';

    /**
     * Throttled — auto-paused by the reputation monitor.
     */
    #[Label('Throttled')]
    #[Description('Auto-throttled by the reputation guardrail after consecutive threshold breaches.')]
    case Throttled = 'throttled';

    /**
     * Archived — retired publication; read-only.
     */
    #[Label('Archived')]
    #[Description('Retired publication. Read-only; no new campaigns can be scheduled.')]
    case Archived = 'archived';
}
