<?php

declare(strict_types=1);

namespace Academorix\ServiceProvider\Bootstrappers;

use Academorix\Foundation\Contracts\DiscoversAttributes;
use Academorix\ServiceProvider\Attributes\AsBootstrapper;
use Academorix\ServiceProvider\Contracts\BootstrapperInterface;
use Academorix\ServiceProvider\Registry\BootstrapperRegistry;
use Illuminate\Container\Attributes\Log;
use Illuminate\Container\Attributes\Singleton;
use Psr\Log\LoggerInterface;
use Throwable;

/**
 * Meta-bootstrapper — populates the {@see BootstrapperRegistry} with
 * every class carrying {@see AsBootstrapper}.
 *
 * ## Why "meta"
 *
 * Every other bootstrapper hydrates a domain registry (personas,
 * tools, retention policies, ...). This one hydrates the registry
 * of bootstrappers themselves — the first pass every framework boot
 * takes so subsequent bootstrappers have a populated catalogue to
 * iterate. Priority `-1000` puts it in the meta-bootstrapper band
 * defined by `.kiro/steering/bootstrappers.md`.
 *
 * ## Why `isCacheable() = false`
 *
 * The discovery pass itself must run every boot — the composer
 * attribute manifest changes with every `composer dump-autoload`,
 * and stale registrations from a previous deploy would silently
 * outlive the class rename. The domain bootstrappers this class
 * registers may themselves be cacheable — their own `isCacheable()`
 * governs their behaviour independently.
 *
 * ## Failure handling
 *
 * Individual class failures (unloadable class, wrong attribute
 * shape) log at WARNING and continue. A discovery pass yielding
 * zero targets is normal on a fresh clone before
 * `composer dump-autoload` has run; the log line makes the state
 * visible without escalating.
 *
 * @see AsBootstrapper Attribute this class scans for.
 * @see BootstrapperRegistry Populated registry.
 *
 * @category Bootstrapper
 *
 * @since    0.1.0
 */
#[Singleton]
final class BootstrapperDiscoveryBootstrapper extends AbstractBootstrapper
{
    /**
     * @param  DiscoversAttributes  $discovery  Shared attribute-discovery seam.
     * @param  BootstrapperRegistry  $registry  Target registry — mutated by {@see populate()}.
     * @param  LoggerInterface  $log  Discovery-time diagnostics.
     */
    public function __construct(
        private readonly DiscoversAttributes $discovery,
        private readonly BootstrapperRegistry $registry,
        #[Log] private readonly LoggerInterface $log,
    ) {}

    /**
     * {@inheritDoc}
     *
     * Stable machine name — matches the framework namespace so the
     * log lines keep a common prefix.
     */
    public function name(): string
    {
        return 'framework.bootstrapper-discovery';
    }

    /**
     * {@inheritDoc}
     *
     * `-1000` places this pass FIRST — every other bootstrapper's
     * registration must be in the registry before the runner tries
     * to iterate it. See the meta-bootstrapper band in
     * `.kiro/steering/bootstrappers.md`.
     */
    public function priority(): int
    {
        return -1000;
    }

    /**
     * {@inheritDoc}
     *
     * Discovery must run every boot — the attribute manifest is
     * authoritative but its contents change per deploy, so no cache
     * layer sits in front. The domain bootstrappers this class
     * registers own their own cache lifetimes.
     */
    public function isCacheable(): bool
    {
        return false;
    }

    /**
     * Scan `#[AsBootstrapper]` and register each hit with the
     * registry.
     *
     * Individual class failures log at WARNING and continue —
     * a single misconfigured target must not halt boot.
     */
    public function populate(): void
    {
        $registered = 0;

        foreach ($this->discovery->forClass(AsBootstrapper::class) as $target) {
            try {
                if (! $target->attribute instanceof AsBootstrapper) {
                    continue;
                }

                if (! $target->attribute->enabled) {
                    continue;
                }

                /** @var class-string<BootstrapperInterface> $class */
                $class = $target->className;

                $this->registry->register($class, $target->attribute->priority);
                $registered++;
            } catch (Throwable $e) {
                $this->log->warning('bootstrapper discovery skipped a class', [
                    'class' => $target->className,
                    'exception' => $e::class,
                    'message' => $e->getMessage(),
                ]);
            }
        }

        $this->log->info('bootstrapper discovery complete', [
            'registered' => $registered,
        ]);
    }
}
