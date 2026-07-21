<?php

declare(strict_types=1);

namespace Stackra\Versioning\Resolvers;

use Stackra\Versioning\Contracts\Services\VersionResolverInterface;
use Illuminate\Http\Request;

/**
 * Webhook-subscription resolver — reads the pinned version from a
 * request attribute the webhook module's inbound receiver populates.
 *
 * The webhook module (or any consumer that pins deliveries to a
 * specific version) sets `stackra.versioning.webhook_subscription_version`
 * on the request before this resolver runs. The attribute name is
 * configurable via `versioning.resolvers.webhook.request_attribute`.
 *
 * This is a stub — it reads the attribute set by the caller and does
 * NOT itself resolve the subscription row. That lookup happens on the
 * caller side because the webhook module owns the `webhook_subscriptions`
 * table.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
final class WebhookSubscriptionResolver implements VersionResolverInterface
{
    /**
     * Resolve a version slug from a webhook-scoped request attribute.
     */
    public function resolve(Request $request): ?string
    {
        $attribute = (string) \config(
            'versioning.resolvers.webhook.request_attribute',
            'stackra.versioning.webhook_subscription_version',
        );

        $value = $request->attributes->get($attribute);
        if (\is_string($value) && $value !== '') {
            return $value;
        }

        return null;
    }
}
