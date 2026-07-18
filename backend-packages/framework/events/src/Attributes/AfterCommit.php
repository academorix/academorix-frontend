<?php

/**
 * @file packages/events/src/Attributes/AfterCommit.php
 *
 * @description
 * Class-level marker attribute that opts a listener class into the
 * "fire only after DB commit" behaviour without requiring the flag
 * on every single {@see \Academorix\Events\Attributes\OnEvent} /
 * {@see \Academorix\Events\Attributes\ListensFor} declaration on
 * the class.
 *
 * ## Semantics
 *
 * When `#[AfterCommit]` is present on a listener class, the
 * discovery scanner treats every `#[OnEvent]` and `#[ListensFor]`
 * declaration on that class as if `afterCommit: true` had been
 * passed — the listener's registration is wrapped so it only fires
 * once the surrounding transaction commits successfully.
 *
 * The per-attribute `afterCommit` flag still takes precedence when
 * set, so a mixed class can opt individual events out again.
 *
 * ## No arguments
 *
 * The attribute is intentionally a pure marker — no properties, no
 * constructor arguments. Its presence is the entire signal.
 */

declare(strict_types=1);

namespace Academorix\Events\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS)]
final class AfterCommit
{
    /**
     * Marker attribute — deliberately empty. The scanner inspects
     * only its presence on the class.
     */
    public function __construct() {}
}
