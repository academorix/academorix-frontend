<?php

declare(strict_types=1);

namespace Stackra\Notifications\Support;

/**
 * Readonly VO describing a single dispatch request.
 *
 * Callers hand this to `DispatchGatewayInterface::dispatch()`. The
 * shape is deliberately narrow — recipient identifier, category,
 * template variables. The gateway resolves preferences, templates,
 * channels itself from the caller-supplied identifiers.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final readonly class NotificationDispatchRequest
{
    /**
     * @param  string                $categorySlug   Module-namespaced category slug.
     * @param  string                $templateKey    Template key (typically matches the slug).
     * @param  string                $tenantId       Tenant id (owner of the recipient).
     * @param  string|null           $applicationId  Application id (null = platform-wide).
     * @param  string                $addresseeType  `user` or `anonymous`.
     * @param  string|null           $addresseeId    Addressee id (null for anonymous).
     * @param  string|null           $addresseeEmail Denormalised email at dispatch time.
     * @param  string|null           $addresseePhone Denormalised phone (E.164) at dispatch time.
     * @param  string                $addresseeName  Denormalised display name at dispatch time.
     * @param  string                $addresseeLocale ISO 639-1 locale.
     * @param  string                $addresseeTimezone IANA timezone.
     * @param  string                $priority       Priority tier backing value.
     * @param  array<string, mixed>  $variables      Template variables.
     * @param  list<string>          $channelsRequested Caller-preferred channels (resolver may override).
     * @param  string                $actorType      `user` / `platform_user` / `system`.
     * @param  string|null           $actorId        Actor id (null for system actor).
     * @param  array<string, mixed>  $metadata       Free-form metadata bag.
     */
    public function __construct(
        public string $categorySlug,
        public string $templateKey,
        public string $tenantId,
        public ?string $applicationId,
        public string $addresseeType,
        public ?string $addresseeId,
        public ?string $addresseeEmail,
        public ?string $addresseePhone,
        public string $addresseeName,
        public string $addresseeLocale,
        public string $addresseeTimezone,
        public string $priority,
        public array $variables = [],
        public array $channelsRequested = [],
        public string $actorType = 'system',
        public ?string $actorId = null,
        public array $metadata = [],
    ) {
    }
}
