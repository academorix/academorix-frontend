<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Services;

use Stackra\Newsletter\Contracts\Data\NewsletterAudienceInterface;
use Stackra\Newsletter\Contracts\Data\NewsletterSubscriptionInterface;
use Stackra\Newsletter\Contracts\Repositories\NewsletterSubscriptionRepositoryInterface;
use Stackra\Newsletter\Contracts\Services\AudienceEvaluatorInterface;
use Stackra\Newsletter\Enums\NewsletterSubscriptionStatus;
use Stackra\Newsletter\Models\NewsletterAudience;
use Stackra\Newsletter\Models\NewsletterSubscription;
use Illuminate\Container\Attributes\Singleton;
use Illuminate\Support\Collection;

/**
 * Default {@see AudienceEvaluatorInterface}.
 *
 * ## Expression DSL
 *
 * Expressions are three-key maps — `all`, `any`, `none`. Each key
 * holds a list of atomic predicates:
 *
 * ```
 * { "field": "tags",              "op": "contains", "value": "vip" }
 * { "field": "engagement_score",  "op": "gte",      "value": 50 }
 * { "field": "locale",            "op": "eq",       "value": "en" }
 * ```
 *
 * Supported ops: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`,
 * `contains`. Unknown predicates default to false-per-record so
 * broken expressions cannot accidentally over-include.
 *
 * The default audience (`is_default = true`) short-circuits to
 * "every active subscription" regardless of `expression`.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Singleton]
final class DefaultAudienceEvaluator implements AudienceEvaluatorInterface
{
    public function __construct(
        private readonly NewsletterSubscriptionRepositoryInterface $subscriptions,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function evaluate(NewsletterAudience $audience): array
    {
        $newsletterId = (string) $audience->{NewsletterAudienceInterface::ATTR_NEWSLETTER_ID};

        // Default audience — every active subscription.
        if ((bool) $audience->{NewsletterAudienceInterface::ATTR_IS_DEFAULT} === true) {
            return $this->subscriptions
                ->findAllActive($newsletterId)
                ->map(static fn (NewsletterSubscription $s): string => (string) $s->getKey())
                ->values()
                ->all();
        }

        $expression = $audience->{NewsletterAudienceInterface::ATTR_EXPRESSION} ?? [];
        if (! \is_array($expression)) {
            return [];
        }

        /** @var Collection<int, NewsletterSubscription> $active */
        $active = $this->subscriptions->findAllActive($newsletterId);

        // Walk the DSL for each candidate.
        $ids = $active
            ->filter(fn (NewsletterSubscription $s): bool => $this->matches($s, $expression))
            ->map(static fn (NewsletterSubscription $s): string => (string) $s->getKey())
            ->values()
            ->all();

        return $ids;
    }

    /**
     * Evaluate the three-key expression against a subscription row.
     *
     * @param  array<string, mixed>  $expression
     */
    private function matches(NewsletterSubscription $subscription, array $expression): bool
    {
        // Only active subscriptions are considered — status was
        // already filtered upstream, but guard defensively.
        $status = $subscription->{NewsletterSubscriptionInterface::ATTR_STATUS};
        $value  = $status instanceof \BackedEnum ? $status->value : (string) $status;
        if ($value !== NewsletterSubscriptionStatus::Active->value) {
            return false;
        }

        /** @var list<array<string, mixed>> $all */
        $all = \is_array($expression['all'] ?? null) ? $expression['all'] : [];
        /** @var list<array<string, mixed>> $any */
        $any = \is_array($expression['any'] ?? null) ? $expression['any'] : [];
        /** @var list<array<string, mixed>> $none */
        $none = \is_array($expression['none'] ?? null) ? $expression['none'] : [];

        // `all` — every predicate must match.
        foreach ($all as $predicate) {
            if (! $this->evaluatePredicate($subscription, $predicate)) {
                return false;
            }
        }

        // `any` — at least one predicate must match (unless the list
        // is empty, in which case the group is vacuously true).
        if ($any !== []) {
            $hit = false;
            foreach ($any as $predicate) {
                if ($this->evaluatePredicate($subscription, $predicate)) {
                    $hit = true;
                    break;
                }
            }
            if (! $hit) {
                return false;
            }
        }

        // `none` — no predicate may match.
        foreach ($none as $predicate) {
            if ($this->evaluatePredicate($subscription, $predicate)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  array<string, mixed>  $predicate
     */
    private function evaluatePredicate(NewsletterSubscription $subscription, array $predicate): bool
    {
        $field = (string) ($predicate['field'] ?? '');
        $op    = (string) ($predicate['op'] ?? 'eq');
        /** @var mixed $expected */
        $expected = $predicate['value'] ?? null;

        if ($field === '') {
            return false;
        }

        /** @var mixed $actual */
        $actual = $subscription->{$field} ?? null;

        return match ($op) {
            'eq'       => $actual == $expected,
            'neq'      => $actual != $expected,
            'gt'       => \is_numeric($actual) && \is_numeric($expected) && $actual > $expected,
            'gte'      => \is_numeric($actual) && \is_numeric($expected) && $actual >= $expected,
            'lt'       => \is_numeric($actual) && \is_numeric($expected) && $actual < $expected,
            'lte'      => \is_numeric($actual) && \is_numeric($expected) && $actual <= $expected,
            'in'       => \is_array($expected) && \in_array($actual, $expected, false),
            'contains' => \is_array($actual) && \in_array($expected, $actual, false),
            default    => false,
        };
    }
}
