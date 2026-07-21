<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Observers;

use Stackra\Notifications\Mail\Contracts\Data\MailSuppressionInterface;
use Stackra\Notifications\Mail\Events\MailSuppressed;
use Stackra\Notifications\Mail\Events\MailSuppressionRevoked;
use Stackra\Notifications\Mail\Exceptions\MailSuppressionNotFoundException;
use Stackra\Notifications\Mail\Models\MailSuppression;

/**
 * Observer on {@see MailSuppression}.
 *
 * Fires the transport-level suppression events + normalises the
 * `email` + `email_domain` columns on save. Refuses deletion of
 * `is_system=true` rows outside a seeder / test context.
 *
 * Wired via `#[ObservedBy]` on the model — never
 * `Model::observe(...)` in a provider.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-mail/observers.json
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
final class MailSuppressionObserver
{
    /**
     * `saving` — normalise the email + populate `email_domain`.
     *
     * Runs on both create + update so admin edits stay normalised.
     */
    public function saving(MailSuppression $row): void
    {
        $rawEmail = (string) ($row->{MailSuppressionInterface::ATTR_EMAIL} ?? '');
        $email    = \strtolower(\trim($rawEmail));

        if ($email !== '' && $email !== $rawEmail) {
            $row->{MailSuppressionInterface::ATTR_EMAIL} = $email;
        }

        // Compute email_domain from email whenever email changes.
        if ($row->isDirty(MailSuppressionInterface::ATTR_EMAIL) && $email !== '') {
            $atPos = \strrpos($email, '@');

            if ($atPos !== false) {
                $row->{MailSuppressionInterface::ATTR_EMAIL_DOMAIN} = \substr($email, $atPos + 1);
            }
        }
    }

    /**
     * `deleting` — refuse `is_system=true` rows outside a
     * mutation-allowed scope. The `HasSystemFlag` trait exposes the
     * scoped-mutation check.
     */
    public function deleting(MailSuppression $row): void
    {
        if ((bool) $row->{MailSuppressionInterface::ATTR_IS_SYSTEM} !== true) {
            return;
        }

        if (\method_exists(MailSuppression::class, 'isSystemMutationAllowed')
            && MailSuppression::isSystemMutationAllowed()) {
            return;
        }

        throw new MailSuppressionNotFoundException(
            \sprintf(
                'Cannot delete the platform-wide mail_suppressions row "%s" — '
                . 'super_admin required.',
                (string) $row->getKey(),
            ),
        );
    }

    /**
     * `created` — fire {@see MailSuppressed}. Source defaults to
     * `webhook` when a `provider` is set; `admin` otherwise.
     */
    public function created(MailSuppression $row): void
    {
        $source = $row->{MailSuppressionInterface::ATTR_PROVIDER} !== null ? 'webhook' : 'admin';

        $reasonRaw = $row->{MailSuppressionInterface::ATTR_REASON};
        $reason = \is_object($reasonRaw) && \property_exists($reasonRaw, 'value')
            ? (string) $reasonRaw->value
            : (string) $reasonRaw;

        MailSuppressed::dispatch(
            (string) $row->getKey(),
            $this->nullableString($row, MailSuppressionInterface::ATTR_TENANT_ID),
            (string) $row->{MailSuppressionInterface::ATTR_EMAIL},
            $reason,
            $source,
        );
    }

    /**
     * `deleted` — fire {@see MailSuppressionRevoked}.
     */
    public function deleted(MailSuppression $row): void
    {
        MailSuppressionRevoked::dispatch(
            (string) $row->getKey(),
            $this->nullableString($row, MailSuppressionInterface::ATTR_TENANT_ID),
            (string) $row->{MailSuppressionInterface::ATTR_EMAIL},
            $this->nullableString($row, MailSuppressionInterface::ATTR_DELETED_BY),
        );
    }

    /**
     * Coerce a nullable string column value.
     */
    private function nullableString(MailSuppression $row, string $key): ?string
    {
        $value = $row->{$key} ?? null;

        if ($value === null || $value === '') {
            return null;
        }

        return (string) $value;
    }
}
