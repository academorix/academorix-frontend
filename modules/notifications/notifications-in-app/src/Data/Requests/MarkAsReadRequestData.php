<?php

declare(strict_types=1);

namespace Academorix\Notifications\InApp\Data\Requests;

use Spatie\LaravelData\Data;

/**
 * Empty body for
 * `POST /api/v1/notifications/in-app/{message}/mark-read`.
 *
 * The message id comes from the URL; the body carries no fields. The
 * DTO exists so the action has a typed input to inject and Spatie
 * validation runs (even against `{}`).
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
final class MarkAsReadRequestData extends Data
{
    public function __construct()
    {
    }
}
