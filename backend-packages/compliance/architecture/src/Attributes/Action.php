<?php

/**
 * @file packages/architecture/src/Attributes/Action.php
 *
 * @description
 * Marker attribute: this class is a single-purpose ACTION —
 * effectively a Service narrowed to one public entry point
 * (`__invoke()`, `execute()`, or `handle()` by convention).
 *
 * ## Why a separate marker from Service
 *
 * Semantically Actions and Services follow the SAME architectural
 * rules (may inject Repositories, may not import Models). We
 * keep them as distinct markers because:
 *
 *   - Different teams / codebases prefer different vocabulary.
 *     Some model the write side as "Actions" (create-invoice,
 *     approve-payment); others call them "Commands"; others put
 *     everything in "Services". Multiple markers let one codebase
 *     stay consistent with local convention without renaming the
 *     rule engine.
 *
 *   - Future rules may branch on the two — for example, a rule
 *     that requires every Action to declare a return type, or
 *     that limits Actions to a single public method.
 *
 * ## Usage
 *
 * ```php
 * use Academorix\Architecture\Attributes\Action;
 *
 * #[Action]
 * final class SendPasswordResetEmail
 * {
 *     public function __construct(
 *         private readonly UserRepository $users,
 *         private readonly Mailer         $mailer,
 *     ) {}
 *
 *     public function execute(string $email): void
 *     {
 *         $user = $this->users->findByEmail($email);
 *         if ($user === null) {
 *             return;
 *         }
 *
 *         $this->mailer->send(new PasswordResetMail($user));
 *     }
 * }
 * ```
 *
 * @see Service                                       Broader orchestrator marker.
 * @see \Academorix\Architecture\Contracts\Action     Interface alternative.
 */

declare(strict_types=1);

namespace Academorix\Architecture\Attributes;

use Attribute;

/**
 * Marker attribute — carries no payload.
 *
 * @final
 */
#[Attribute(Attribute::TARGET_CLASS)]
final class Action
{
    public function __construct()
    {
        // Intentionally empty — marker attribute.
    }
}
