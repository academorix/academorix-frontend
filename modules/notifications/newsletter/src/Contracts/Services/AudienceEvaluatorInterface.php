<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Contracts\Services;

use Academorix\Newsletter\Models\NewsletterAudience;
use Academorix\Newsletter\Services\DefaultAudienceEvaluator;
use Illuminate\Container\Attributes\Bind;

/**
 * Evaluate an audience segment expression against the newsletter's
 * active subscribers.
 *
 * The expression is a rule-based JSON DSL — the evaluator is the
 * canonical interpreter. Implementations translate the DSL into an
 * Eloquent query against the subscription repository and return the
 * list of matching subscription ids.
 *
 * Ships one shape today (rule-based expressions); the interface
 * exists so future segmentation strategies (SQL-native rule
 * compiler, external audience-as-a-service) can slot in without
 * touching call sites.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Bind(DefaultAudienceEvaluator::class)]
interface AudienceEvaluatorInterface
{
    /**
     * Evaluate `$audience->expression` and return the list of
     * matching active subscription ids.
     *
     * @return list<string>
     */
    public function evaluate(NewsletterAudience $audience): array;
}
