<?php

declare(strict_types=1);

namespace Stackra\Invitations\Concerns;

use Stackra\Invitations\Contracts\Data\InvitationInterface;
use Stackra\Invitations\Contracts\Services\InvitationTargetRegistryInterface;
use Stackra\Invitations\Enums\InvitationStatus;
use Stackra\Invitations\Exceptions\InvitationStateTransitionForbiddenException;
use Stackra\Invitations\Models\Invitation;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * Composed on any Eloquent model that can receive invitations
 * (Tenant, Team, Athlete, Federation, TrialSession, ...).
 *
 * Adds a polymorphic `invitations()` `MorphMany` relation, a
 * pre-scoped `pendingInvitations()` shortcut, and the fluent
 * helpers `invite()` / `revokeInvitation()`. The composing model
 * must ALSO be registered with
 * {@see InvitationTargetRegistryInterface} by carrying
 * `#[\Stackra\Invitations\Attributes\Invitable]` — the framework's
 * generic hydration pump discovers every attributed class at boot
 * and calls
 * {@see InvitationTargetRegistryInterface::register()} on each hit.
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
trait HasInvitations
{
    /**
     * Every invitation targeting this host — regardless of state.
     *
     * @return MorphMany<Invitation, $this>
     */
    public function invitations(): MorphMany
    {
        return $this->morphMany(
            Invitation::class,
            'target',
            InvitationInterface::ATTR_TARGET_TYPE,
            InvitationInterface::ATTR_TARGET_ID,
        );
    }

    /**
     * Every non-terminal invitation targeting this host —
     * `pending` / `delivered` / `opened` / `clicked` / `bounced`.
     *
     * @return MorphMany<Invitation, $this>
     */
    public function pendingInvitations(): MorphMany
    {
        return $this->invitations()
            ->whereIn(
                InvitationInterface::ATTR_STATE,
                [
                    InvitationStatus::Pending->value,
                    InvitationStatus::Delivered->value,
                    InvitationStatus::Opened->value,
                    InvitationStatus::Clicked->value,
                    InvitationStatus::Bounced->value,
                ],
            );
    }

    /**
     * Create and persist an {@see Invitation} for this host.
     *
     * Every attribute is optional except `$email`. Callers pass:
     *
     *   - `role_key`   — target-scoped role assigned on accept.
     *   - `inviter`    — a User / ServiceAccount / null (system).
     *   - `channel`    — {@see InvitationChannel} case; defaults
     *     to `config('invitations.delivery.default_channel')`.
     *   - `grants`     — free-form structured grant payload passed
     *     to the accept handler.
     *   - `message`    — optional freeform message shown to the
     *     invitee.
     *   - `expires_at` — override the default expiry window.
     *
     * The observer is responsible for token generation, state
     * defaulting, and dispatching `SendInvitationJob`; this method
     * only creates the row and hands the concrete off.
     *
     * @param  array<string, mixed>  $params
     */
    public function invite(string $email, array $params = []): Invitation
    {
        /** @var InvitationTargetRegistryInterface $registry */
        $registry = \app(InvitationTargetRegistryInterface::class);
        $targetType = $registry->normalise(static::class);

        /** @var array<string, mixed> $grants */
        $grants = $params['grants'] ?? [];

        $inviterType = 'system';
        $inviterId   = null;
        if (isset($params['inviter']) && \is_object($params['inviter'])) {
            $inviterClass = \get_class($params['inviter']);
            $inviterType  = \strtolower((string) \substr(
                $inviterClass,
                (int) \strrpos($inviterClass, '\\') + 1,
            ));
            $method     = 'getKey';
            $inviterId  = \method_exists($params['inviter'], $method)
                ? (string) $params['inviter']->{$method}()
                : null;
        }

        /** @var Invitation $invitation */
        $invitation = Invitation::query()->create([
            InvitationInterface::ATTR_APPLICATION_ID => $params['application_id'] ?? null,
            InvitationInterface::ATTR_TENANT_ID      => $params['tenant_id'] ?? $this->resolveTenantIdForInvitation(),
            InvitationInterface::ATTR_TARGET_TYPE    => $targetType,
            InvitationInterface::ATTR_TARGET_ID      => (string) $this->getKey(),
            InvitationInterface::ATTR_INVITER_TYPE   => $inviterType,
            InvitationInterface::ATTR_INVITER_ID     => $inviterId,
            InvitationInterface::ATTR_EMAIL          => \strtolower($email),
            InvitationInterface::ATTR_CHANNEL        => $params['channel']
                ?? (string) \config('invitations.delivery.default_channel', 'email'),
            InvitationInterface::ATTR_ROLE_KEY       => $params['role_key'] ?? null,
            InvitationInterface::ATTR_GRANTS         => $grants,
            InvitationInterface::ATTR_MESSAGE        => $params['message'] ?? null,
            InvitationInterface::ATTR_EXPIRES_AT     => $params['expires_at'] ?? null,
        ]);

        return $invitation;
    }

    /**
     * Transition a pending invitation for this host to `revoked`.
     *
     * @throws InvitationStateTransitionForbiddenException
     *   When the invitation is in a terminal state.
     */
    public function revokeInvitation(string $invitationId, ?string $reason = null): Invitation
    {
        /** @var Invitation|null $invitation */
        $invitation = $this->invitations()
            ->where(InvitationInterface::ATTR_ID, $invitationId)
            ->first();

        if ($invitation === null) {
            throw new \RuntimeException(\sprintf(
                'Invitation "%s" not found for host "%s".',
                $invitationId,
                static::class,
            ));
        }

        if ($invitation->isPending() === false) {
            throw new InvitationStateTransitionForbiddenException(\sprintf(
                'Cannot revoke invitation "%s" in terminal state.',
                $invitationId,
            ));
        }

        $invitation->{InvitationInterface::ATTR_STATE}          = InvitationStatus::Revoked;
        $invitation->{InvitationInterface::ATTR_REVOKED_AT}     = \now();
        $invitation->{InvitationInterface::ATTR_REVOKED_REASON} = $reason;
        $invitation->save();

        return $invitation;
    }

    /**
     * Derive the tenant id for a new invitation. Composing models
     * override this when they carry their own `tenant_id`
     * accessor; the default reads a `tenant_id` attribute if the
     * host is tenant-scoped and null otherwise (platform-scope
     * invitations).
     */
    protected function resolveTenantIdForInvitation(): ?string
    {
        $value = $this->getAttribute('tenant_id');

        return \is_string($value) ? $value : null;
    }
}
