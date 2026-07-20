<?php

/**
 * @file packages/health/src/Support/HealthCheckDiscoverer.php
 *
 * @description
 * The workhorse that turns discovered `#[AsHealthCheck]` metadata
 * into concrete registrations against Spatie's Health facade.
 *
 * ## Attribute-only design
 *
 * The old backend supported both attribute discovery AND a
 * programmatic "contributor" contract (packages could subclass a
 * `AbstractModuleHealthProvider` and return checks from a `checks()`
 * method). That's gone — attributes are the sole registration path.
 *
 * Two consequences:
 *
 *   1. **Zero boilerplate.** A check class + one attribute IS the
 *      registration. No service provider, no manual list to
 *      maintain in a parent module.
 *
 *   2. **DI-friendly construction.** Instead of Spatie's static
 *      `Check::new()` factory (which is just `new static()` — no
 *      DI), the discoverer resolves each target class through
 *      Laravel's container via {@see \Illuminate\Contracts\Container\Container::make()}.
 *      That means checks can declare typed constructor
 *      dependencies (a `Connection`, a `Cache\Repository`, a
 *      domain service, etc.) and the container hydrates them just
 *      like any other class. The pgvector check in the AI package
 *      is the canonical example — it needs the current DB
 *      connection to probe `pg_extension` and would not work with
 *      no-args instantiation.
 *
 * ## Lifecycle
 *
 *   1. `composer dump-autoload` runs `olvlvl/composer-attribute-collector`
 *      which scans every package under the autoload map, finds every
 *      class carrying `#[AsHealthCheck]`, and writes the target list
 *      to `vendor/attributes.php`.
 *   2. At application boot,
 *      {@see \Academorix\Health\Providers\HealthServiceProvider} calls
 *      {@see discover()} once — before Spatie's Health facade is
 *      exercised so registered checks show up on `/health` and in
 *      the scheduler.
 *   3. {@see discover()} iterates every discovered target, applies
 *      the invariants documented on the attribute itself, and
 *      returns a fully-configured list of Spatie `Check` instances.
 *      Registration against the facade is the caller's
 *      responsibility (`Health::checks(...)`).
 *
 * ## Failure semantics
 *
 * Invariant violations at boot are FATAL — a check without a valid
 * class or a duplicate name is a bug the operator wants surfaced
 * immediately, not silently ignored. Every path that could throw
 * ends up as an {@see \InvalidArgumentException} with a message
 * that names the offending class + attribute field.
 *
 * The one exception is a missing / mis-configured notification
 * channel. That case only warns (via the logger) because dev / local
 * environments frequently have no Slack / PagerDuty routing wired,
 * and we don't want boot to fail because of it. See
 * {@see HealthNotificationConfig} for the rationale.
 *
 * ## Testability
 *
 * Every collaborator (container, config, logger) is injected.
 * Feature tests substitute an in-memory config + a memory logger,
 * then assert on the recorded warnings without ever touching
 * Spatie's real machinery.
 *
 * @see \Academorix\Health\Attributes\AsHealthCheck  Attribute this class consumes.
 * @see \Academorix\Health\Providers\HealthServiceProvider  Wires this class in.
 */

declare(strict_types=1);

namespace Academorix\Health\Support;

use Academorix\Health\Attributes\AsHealthCheck;
use Academorix\Health\Enums\HealthNotificationChannel;
use Illuminate\Contracts\Container\Container;
use InvalidArgumentException;
use olvlvl\ComposerAttributeCollector\Attributes;
use olvlvl\ComposerAttributeCollector\TargetClass;
use Psr\Log\LoggerInterface;
use Spatie\Health\Checks\Check;

final class HealthCheckDiscoverer
{
    /**
     * @param Container $container Laravel's container — used to
     *   resolve each target class with full constructor DI.
     * @param HealthNotificationConfig $notifications Channel
     *   resolver — translates enum cases into concrete
     *   notifiables read from `config/health.php`.
     * @param LoggerInterface $logger PSR-3 log sink for warnings
     *   (missing channel routing, un-primed attribute collector).
     */
    public function __construct(
        private readonly Container $container,
        private readonly HealthNotificationConfig $notifications,
        private readonly LoggerInterface $logger,
    ) {
    }

    /**
     * Discover every `#[AsHealthCheck]` target, apply invariants,
     * return a merged list of fully-configured Spatie `Check`
     * instances.
     *
     * The caller owns the registration side-effect — this method
     * is side-effect-free apart from structured warnings.
     *
     * @return list<Check>
     * @throws InvalidArgumentException On invariant violation
     *   (missing base class, duplicate name, invalid condition).
     */
    public function discover(): array
    {
        $checks = [];
        $seenNames = [];

        foreach ($this->collectAttributeTargets() as $target) {
            $check = $this->buildFromAttribute($target, $seenNames);

            if ($check !== null) {
                $checks[] = $check;
            }
        }

        return $checks;
    }

    /**
     * Retrieve every `#[AsHealthCheck]` target class the collector
     * has recorded for this composer install.
     *
     * Wrapped in guard rails so the package can boot even when:
     *
     *   - `olvlvl/composer-attribute-collector` isn't installed
     *     (unusual, but supported by our composer manifest as an
     *     optional plugin path).
     *   - The collector's provider isn't primed yet — happens on a
     *     fresh clone before `composer install` completes, and in
     *     bare Testbench harnesses that skip composer's autoload
     *     bootstrap.
     *
     * In both cases we return an empty list and let the operator's
     * next `composer install` / `composer dump-autoload` fill in
     * the actual targets.
     *
     * @return array<TargetClass<AsHealthCheck>>
     */
    private function collectAttributeTargets(): array
    {
        if (! class_exists(Attributes::class)) {
            $this->logger->warning(
                'olvlvl/composer-attribute-collector is not installed — '
                . 'health check discovery is skipped. Run `composer install` and retry.',
            );

            return [];
        }

        try {
            return Attributes::findTargetClasses(AsHealthCheck::class);
        } catch (\Throwable $exception) {
            // The collector throws a LogicException when its provider
            // has never been initialised (e.g. running in a bare test
            // harness). Treat that as "nothing to discover" rather
            // than a fatal — the alternative is every unit test that
            // boots the framework needing the collector wired up.
            $this->logger->warning(
                'Health check attribute discovery skipped: {message}',
                ['message' => $exception->getMessage()],
            );

            return [];
        }
    }

    /**
     * Build a fully-configured {@see Check} from one attribute
     * target — or `null` if the target is gated off by
     * `enabled: false` or a failing condition.
     *
     * @param TargetClass<AsHealthCheck> $target Discovered target
     *   with the attribute instance attached.
     * @param array<string, class-string> $seenNames Mutable name
     *   registry threaded through for uniqueness checking across
     *   the full discovery run.
     */
    private function buildFromAttribute(TargetClass $target, array &$seenNames): ?Check
    {
        $className = $target->name;
        $attribute = $target->attribute;

        // Invariant 1 — target class must extend Spatie's Check.
        // Enforced here rather than at attribute-declaration time
        // because PHP attributes have no way to constrain their
        // target's parent class.
        if (! is_subclass_of($className, Check::class)) {
            throw new InvalidArgumentException(sprintf(
                '#[AsHealthCheck] target %s must extend %s.',
                $className,
                Check::class,
            ));
        }

        // Invariant 2 — static disable switch.
        if (! $attribute->enabled) {
            return null;
        }

        // Invariant 3 — optional runtime gate.
        if ($attribute->condition !== null && ! $this->evaluateCondition($className, $attribute->condition)) {
            return null;
        }

        // Invariant 4 — unique names across every discovered check.
        // Duplicate names would confuse Spatie's result store (which
        // keys by name) and the notification deduplication logic.
        if (isset($seenNames[$attribute->name])) {
            throw new InvalidArgumentException(sprintf(
                'Duplicate #[AsHealthCheck] name "%s" — declared by both %s and %s.',
                $attribute->name,
                $seenNames[$attribute->name],
                $className,
            ));
        }
        $seenNames[$attribute->name] = $className;

        // Instantiate via Spatie's `::new()` factory. Despite the
        // static-factory look, `Check::new()` internally calls
        // `app(static::class)` — so Laravel's container DI just
        // works, and constructor-typed dependencies are hydrated
        // exactly the same way as with `$container->make()`. The
        // factory also seeds a default `everyMinute()` schedule,
        // which we may overwrite below with a cron expression from
        // the attribute.
        /** @var Check $check */
        $check = $className::new();

        // Apply metadata declared on the attribute.
        $check->name($attribute->name);

        if ($attribute->label !== null) {
            $check->label($attribute->label);
        }

        if ($attribute->schedule !== null) {
            // Spatie's Check uses Laravel's `ManagesFrequencies`
            // trait, which exposes `cron()` as a direct method that
            // sets the underlying `$expression` property. We can
            // call it right after `Check::new()` (which sets a
            // default of `'* * * * *'`) — `cron()` overwrites the
            // expression cleanly.
            $check->cron($attribute->schedule);
        }

        if ($attribute->channel !== null) {
            $this->attachChannel($check, $attribute->channel, $attribute->name);
        }

        return $check;
    }

    /**
     * Call the optional condition method on the target class.
     *
     * The method must be `public static` and return `bool`. Anything
     * else is a bug in the check class (not a runtime environment
     * issue), so it throws — the operator wants to know their
     * `#[AsHealthCheck(condition: 'foo')]` declaration is broken.
     *
     * @param class-string<Check> $className
     */
    private function evaluateCondition(string $className, string $methodName): bool
    {
        if (! method_exists($className, $methodName)) {
            throw new InvalidArgumentException(sprintf(
                '#[AsHealthCheck(condition: "%s")] on %s references a method that does not exist.',
                $methodName,
                $className,
            ));
        }

        try {
            $reflection = new \ReflectionMethod($className, $methodName);
        } catch (\ReflectionException $exception) {
            throw new InvalidArgumentException(sprintf(
                '#[AsHealthCheck(condition: "%s")] on %s: reflection failed (%s).',
                $methodName,
                $className,
                $exception->getMessage(),
            ), previous: $exception);
        }

        if (! $reflection->isStatic() || ! $reflection->isPublic()) {
            throw new InvalidArgumentException(sprintf(
                '#[AsHealthCheck(condition: "%s")] on %s must reference a PUBLIC STATIC method.',
                $methodName,
                $className,
            ));
        }

        $returnType = $reflection->getReturnType();

        if (! $returnType instanceof \ReflectionNamedType || $returnType->getName() !== 'bool') {
            throw new InvalidArgumentException(sprintf(
                '#[AsHealthCheck(condition: "%s")] on %s must return bool.',
                $methodName,
                $className,
            ));
        }

        return (bool) $className::$methodName();
    }

    /**
     * Wire the notification channel routing on the check.
     *
     * Missing / mis-configured channels warn but don't throw — see
     * class docblock for the "prod fails loud, dev fails soft"
     * rationale.
     */
    private function attachChannel(Check $check, HealthNotificationChannel $channel, string $checkName): void
    {
        $config = $this->notifications->resolveChannel($channel);

        if ($config === null) {
            $this->logger->warning(
                'Health check "{name}" declared channel "{channel}" but no config maps that '
                . 'channel to a concrete notifiable in the current environment. Failures will '
                . 'still show on the dashboard; no push notification will fire.',
                [
                    'name' => $checkName,
                    'channel' => $channel->value,
                ],
            );

            return;
        }

        // Spatie's Health notification routing is global (per-app),
        // not per-check. We record the check → channel mapping on
        // the check's metadata so the app's notification builder
        // can pick the right notifiable when a check fails. See
        // HealthServiceProvider for the routing pipeline.
        //
        // The `notifyOnFailure` API differs across Spatie's minor
        // versions; we use `->meta()` (stable since v1.0) so this
        // package doesn't chase Spatie's release cadence.
        $check->meta([
            'notification_channel' => $channel->value,
            'notification_config' => $config,
        ]);
    }
}
