<?php

declare(strict_types=1);

namespace Stackra\Compliance\Contracts\Services;

use Stackra\Compliance\Services\DefaultConsentGate;
use Illuminate\Container\Attributes\Bind;

/**
 * Fast-lookup gate for the consent-required check.
 *
 * The default implementation caches the latest decision in Redis
 * with a short TTL — the observer invalidates the tenant tag on
 * ConsentGiven / ConsentWithdrawn.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Bind(DefaultConsentGate::class)]
interface ConsentGateInterface
{
    /**
     * Whether the subject has an active consent for the category.
     *
     * @param  string  $subjectType  Polymorphic subject class.
     * @param  string  $subjectId    Polymorphic subject id.
     * @param  string  $category     Category key.
     */
    public function has(string $subjectType, string $subjectId, string $category): bool;

    /**
     * Flush the cached decision for one subject.
     */
    public function flush(string $subjectType, string $subjectId): void;
}
