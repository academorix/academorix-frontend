<?php

declare(strict_types=1);

namespace Academorix\Leads\Services;

use Academorix\Leads\Contracts\Services\LeadAttributionSnapshotterInterface;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Contracts\Container\Container;

/**
 * Concrete implementation of {@see LeadAttributionSnapshotterInterface}.
 *
 * Reads from growth::attribution when the module is installed; falls
 * back to `null` when it isn't. The soft-integration keeps the leads
 * module bootable in installations that don't ship the attribution
 * module (small-tier tenants that don't buy marketing analytics).
 *
 * The service resolves `AttributionContextInterface` lazily through
 * the container rather than injecting it in the constructor — the
 * interface may not be bound when attribution isn't installed, and a
 * hard constructor dependency would fail Octane's DI graph at boot.
 *
 * @category Leads
 *
 * @since    0.1.0
 */
#[Scoped]
final class LeadAttributionSnapshotter implements LeadAttributionSnapshotterInterface
{
    public function __construct(
        private readonly Container $container,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function currentSnapshot(): ?array
    {
        // The growth::attribution package publishes this interface;
        // we soft-check its presence rather than hard-require it so
        // the leads package can stand alone in installations that
        // don't ship attribution.
        $contextInterface = 'Stackra\\Attribution\\Contracts\\Services\\AttributionContextInterface';

        if (! $this->container->bound($contextInterface)) {
            return null;
        }

        /** @var object $context */
        $context = $this->container->make($contextInterface);

        // Duck-typed to the shape landed in commit f0f237f26 (UTM +
        // referrer + click-id + hashed IP). If the interface renames
        // its accessor, callers see a null snapshot rather than a
        // fatal — attribution is best-effort.
        if (! \method_exists($context, 'toSnapshot')) {
            return null;
        }

        $snapshot = $context->toSnapshot();

        return \is_array($snapshot) && $snapshot !== [] ? $snapshot : null;
    }
}
