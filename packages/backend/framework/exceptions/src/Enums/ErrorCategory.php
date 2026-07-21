<?php

/**
 * @file packages/exceptions/src/Enums/ErrorCategory.php
 *
 * @description
 * Coarse-grained bucket every exception belongs to. Used for:
 *
 *   - Sentry tag routing (each category has its own project / channel).
 *   - Dashboards that group errors ("show me every `integration` error
 *     in the last hour").
 *   - Metric labels (Prometheus `stackra_exceptions_total{category=...}`).
 *
 * The category is orthogonal to HTTP status. A single 400 could be
 * validation OR business; a single 500 could be infrastructure OR
 * business-invariant. Grouping by status alone throws away useful
 * signal.
 */

declare(strict_types=1);

namespace Stackra\Exceptions\Enums;

use Stackra\Enum\Enum;

enum ErrorCategory: string
{
    use Enum;

    /** Field-level input rejected before it hit the domain. */
    case Validation = 'validation';

    /** Missing / invalid credentials or token. */
    case Authentication = 'authentication';

    /** Authenticated but the action was denied by a policy / gate. */
    case Authorization = 'authorization';

    /** The resource genuinely does not exist. */
    case NotFound = 'not_found';

    /** State-shape conflict (duplicate resource, optimistic lock). */
    case Conflict = 'conflict';

    /** Throttled — too many requests. */
    case RateLimit = 'rate_limit';

    /** Feature toggle blocked the action. */
    case FeatureFlag = 'feature_flag';

    /** Business rule violated (semantics, not shape). */
    case Business = 'business';

    /** Tenancy scope violated or missing. */
    case Tenancy = 'tenancy';

    /** Payment / plan / seat constraint. */
    case Billing = 'billing';

    /** Third-party integration returned an error / timed out. */
    case Integration = 'integration';

    /** Internal infrastructure — DB, cache, queue, config. */
    case Infrastructure = 'infrastructure';

    /** Something we didn't anticipate. */
    case Unexpected = 'unexpected';

    /** Security-relevant (audit + alert channels). */
    case Security = 'security';
}
