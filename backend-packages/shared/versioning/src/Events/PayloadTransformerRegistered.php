<?php

declare(strict_types=1);

namespace Academorix\Versioning\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched at boot every time
 * {@see \Academorix\Versioning\Services\PayloadTransformerRegistry::register()}
 * receives a `#[AsPayloadTransformer]` hit from the framework's
 * generic
 * {@see \Academorix\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 * pump.
 *
 * Consumers listen to build the introspection surface for the
 * `versioning:transformers` command and the admin dashboard's chain
 * visualiser.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'versioning.payload_transformer.registered')]
final readonly class PayloadTransformerRegistered
{
    use Dispatchable;

    public function __construct(
        public string $surface,
        public string $event,
        public string $from,
        public string $to,
        public string $className,
    ) {
    }
}
