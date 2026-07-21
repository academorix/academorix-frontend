<?php

declare(strict_types=1);

namespace Stackra\Versioning\Attributes;

use Attribute;

/**
 * Register a class as a payload transformer with the
 * {@see \Stackra\Versioning\Services\PayloadTransformerRegistry}.
 *
 * A transformer is a pure function `transform(array $payload): array`
 * that converts a payload from `$from` to `$to` on a single surface
 * (`rest` / `webhook` / `graphql`) for a single event or endpoint
 * identifier.
 *
 * ```php
 * #[AsPayloadTransformer(
 *     surface: 'webhook',
 *     event: 'invitation.sent',
 *     from: 'v1',
 *     to: 'v2',
 * )]
 * final class InvitationSentV1ToV2Transformer
 * {
 *     public function transform(array $payload): array
 *     {
 *         return [...$payload, 'invited_by_user_id' => $payload['inviter_id'] ?? null];
 *     }
 * }
 * ```
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsPayloadTransformer
{
    /**
     * @param  string  $surface  One of `rest`, `webhook`, `graphql`.
     * @param  string  $event    Event or endpoint identifier (e.g. `invitation.sent`).
     * @param  string  $from     Source version slug.
     * @param  string  $to       Target version slug.
     */
    public function __construct(
        public string $surface,
        public string $event,
        public string $from,
        public string $to,
    ) {
    }
}
