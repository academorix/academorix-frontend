<?php

declare(strict_types=1);

namespace Academorix\Audit\Data;

use Academorix\Audit\Contracts\Data\AuditInterface;
use Academorix\Audit\Contracts\Services\AuditRegistryInterface;
use Academorix\Audit\Enums\AuditPermission;
use Academorix\Audit\Models\Audit;
use Illuminate\Contracts\Container\BindingResolutionException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Facade;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see Audit}.
 *
 * ## Redaction contract
 *
 * The DTO redacts fields flagged by the auditable class's
 * `#[Auditable(encryptFields: [...])]` list UNLESS the caller holds
 * {@see AuditPermission::ViewAll} (platform admin). Non-privileged
 * callers see `[REDACTED]` in place of the value.
 *
 * The redaction runs on the wire projection — the underlying row
 * still carries the ciphered value. This deliberately keeps the raw
 * cipher blob off the wire and out of tenant-DPO snapshots even when
 * the KMS cipher is trivially reversible.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class AuditData extends Data
{
    /**
     * @param  string                    $id             `aud_<ulid>`.
     * @param  string                    $event          One of
     *   `created` / `updated` / `deleted` / `restored`.
     * @param  string                    $auditableType  Polymorphic
     *   type of the target (owen-it morph map).
     * @param  string                    $auditableId    Target id.
     * @param  \DateTimeInterface        $createdAt      Recorded at.
     * @param  string|null               $tenantId       Owning tenant,
     *   or NULL for platform-plane rows.
     * @param  string|null               $userType       Actor
     *   polymorphic type.
     * @param  string|null               $userId         Actor id.
     * @param  array<string, mixed>|null $oldValues      Pre-change
     *   snapshot; encrypted fields replaced with `[REDACTED]` unless
     *   the caller is a platform admin.
     * @param  array<string, mixed>|null $newValues      Post-change
     *   snapshot; encrypted fields replaced with `[REDACTED]` unless
     *   the caller is a platform admin.
     * @param  string|null               $url            Request URL
     *   captured by owen-it's resolver.
     * @param  string|null               $ipAddress      Actor IP.
     * @param  string|null               $userAgent      Actor user
     *   agent.
     * @param  array<int, string>|null   $tags           Free-form
     *   tags.
     * @param  string|null               $chainHash      Chain digest,
     *   or NULL when the row didn't participate in the chain.
     * @param  \DateTimeInterface|null   $chainVerifiedAt Last
     *   successful verification pass.
     * @param  array<string, mixed>|null $metadata       JSONB
     *   metadata satellite.
     */
    public function __construct(
        public string $id,
        public string $event,
        public string $auditableType,
        public string $auditableId,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        public ?string $tenantId = null,
        public ?string $userType = null,
        public ?string $userId = null,
        public ?array $oldValues = null,
        public ?array $newValues = null,
        public ?string $url = null,
        public ?string $ipAddress = null,
        public ?string $userAgent = null,
        public ?array $tags = null,
        public ?string $chainHash = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $chainVerifiedAt = null,
        public ?array $metadata = null,
    ) {
    }

    /**
     * Build the DTO from a persisted audit row.
     *
     * Redacts fields declared on the auditable class's
     * `#[Auditable(encryptFields: ...)]` list unless the caller holds
     * {@see AuditPermission::ViewAll}. Config-level `audit.redacted_paths`
     * always redact regardless of permission.
     */
    public static function fromModel(Audit $audit): self
    {
        $encryptedFields = self::encryptedFieldsFor((string) $audit->{AuditInterface::ATTR_AUDITABLE_TYPE});
        $unmask          = self::callerHoldsViewAll();

        // Always-redact list from config — these paths mask even for
        // platform admins because their plaintext isn't compliance
        // evidence, it's a bypass surface.
        $alwaysRedact = (array) \config('audit.redacted_paths', []);

        return new self(
            id: (string) $audit->getKey(),
            event: (string) $audit->{AuditInterface::ATTR_EVENT},
            auditableType: (string) $audit->{AuditInterface::ATTR_AUDITABLE_TYPE},
            auditableId: (string) $audit->{AuditInterface::ATTR_AUDITABLE_ID},
            createdAt: $audit->{AuditInterface::ATTR_CREATED_AT},
            tenantId: $audit->{AuditInterface::ATTR_TENANT_ID},
            userType: $audit->{AuditInterface::ATTR_USER_TYPE},
            userId: $audit->{AuditInterface::ATTR_USER_ID},
            oldValues: self::redactPayload(
                $audit->{AuditInterface::ATTR_OLD_VALUES},
                $unmask ? $alwaysRedact : \array_merge($encryptedFields, $alwaysRedact),
            ),
            newValues: self::redactPayload(
                $audit->{AuditInterface::ATTR_NEW_VALUES},
                $unmask ? $alwaysRedact : \array_merge($encryptedFields, $alwaysRedact),
            ),
            url: $audit->{AuditInterface::ATTR_URL},
            ipAddress: $audit->{AuditInterface::ATTR_IP_ADDRESS},
            userAgent: $audit->{AuditInterface::ATTR_USER_AGENT},
            tags: self::normaliseTags($audit->{AuditInterface::ATTR_TAGS}),
            chainHash: $audit->{AuditInterface::ATTR_CHAIN_HASH},
            chainVerifiedAt: $audit->{AuditInterface::ATTR_CHAIN_VERIFIED_AT},
            metadata: $audit->{AuditInterface::ATTR_METADATA},
        );
    }

    /**
     * Look up the current caller's encrypt-field list on the shared
     * registry. Fails soft — no registry bound returns an empty list
     * so the DTO renders without redaction rather than crashing.
     *
     * @return list<string>
     */
    private static function encryptedFieldsFor(string $auditableType): array
    {
        try {
            $app = Facade::getFacadeApplication();
        } catch (\Throwable) {
            return [];
        }

        if ($app === null || ! $app->bound(AuditRegistryInterface::class)) {
            return [];
        }

        try {
            /** @var AuditRegistryInterface $registry */
            $registry = $app->make(AuditRegistryInterface::class);
            return $registry->encryptedFieldsFor($auditableType);
        } catch (BindingResolutionException) {
            return [];
        }
    }

    /**
     * Does the currently-authenticated user hold the platform
     * `view_all` permission?
     */
    private static function callerHoldsViewAll(): bool
    {
        try {
            $user = Auth::user();
        } catch (\Throwable) {
            return false;
        }

        return $user !== null && \method_exists($user, 'can')
            && (bool) $user->can(AuditPermission::ViewAll->value);
    }

    /**
     * Walk the payload and replace each flagged key with `[REDACTED]`.
     * `null` in → `null` out.
     *
     * @param  array<string, mixed>|null  $payload
     * @param  list<string>               $redactKeys
     * @return array<string, mixed>|null
     */
    private static function redactPayload(?array $payload, array $redactKeys): ?array
    {
        if ($payload === null || $redactKeys === []) {
            return $payload;
        }

        foreach ($redactKeys as $key) {
            if (\array_key_exists($key, $payload)) {
                $payload[$key] = '[REDACTED]';
            }
        }

        return $payload;
    }

    /**
     * owen-it's `tags` column is a comma-separated string. Normalise
     * to a flat list on the wire.
     *
     * @return list<string>|null
     */
    private static function normaliseTags(mixed $tags): ?array
    {
        if ($tags === null || $tags === '') {
            return null;
        }

        if (\is_array($tags)) {
            return \array_values(\array_map('strval', $tags));
        }

        return \array_values(\array_filter(
            \array_map('trim', \explode(',', (string) $tags)),
            static fn (string $t): bool => $t !== '',
        ));
    }
}
