<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Explicit allow/deny decision persisted on `feature_overrides` rows.
 *
 * ## Cases
 *
 *  * {@see self::Allow} — resolver returns `true` when this row wins the Override layer.
 *  * {@see self::Deny}  — resolver returns `false` with source `override`;
 *    the middleware raises HTTP 403 with error code
 *    `feature_flags.override_denied` (Requirement 5.5).
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum OverrideDecision: string
{
    use Enum;

    /**
     * Allow — the row explicitly enables the flag for this subject.
     */
    #[Label('Allow')]
    #[Description('Explicitly enables the flag for the target subject.')]
    case Allow = 'allow';

    /**
     * Deny — the row explicitly disables the flag for this subject.
     */
    #[Label('Deny')]
    #[Description('Explicitly disables the flag for the target subject.')]
    case Deny = 'deny';
}
