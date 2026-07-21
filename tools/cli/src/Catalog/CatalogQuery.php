<?php

/**
 * @file CatalogQuery.php
 * @module Stackra\Cli\Catalog
 * @description Higher-level lookups on top of {@see CatalogReader}. Owns
 *   the 25 curated capability groups and the 5 business-type default
 *   sets used by `stackra new` during interactive setup.
 */

declare(strict_types=1);

namespace Stackra\Cli\Catalog;

/**
 * Semantic queries over the raw catalogue.
 */
final class CatalogQuery
{
    /**
     * Twenty-five curated capability groups. Each `key => label` pair
     * is presented in the `stackra new` capability multiselect.
     *
     * @var array<string, string>
     */
    public const CAPABILITY_GROUPS = [
        'auth-identity' => 'Auth & identity',
        'multi-tenancy' => 'Multi-tenancy',
        'access-control' => 'Access control (roles/permissions)',
        'approvals-delegation' => 'Approvals + delegation',
        'http-apis' => 'HTTP + APIs',
        'realtime' => 'Realtime + websockets',
        'data-storage' => 'Data storage',
        'caching' => 'Caching',
        'job-queue' => 'Job queue',
        'task-scheduling' => 'Task scheduling',
        'notifications' => 'Notifications (in-app/mail/sms/push)',
        'analytics' => 'Analytics',
        'monitoring' => 'Monitoring + observability',
        'audit-trails' => 'Audit trails',
        'activity-feeds' => 'Activity feeds',
        'feature-flags' => 'Feature flags',
        'search' => 'Search',
        'i18n' => 'i18n',
        'media-storage' => 'Media / storage',
        'payments' => 'Payments + subscriptions',
        'entitlements' => 'Entitlements',
        'consent' => 'Consent management',
        'terminal-ui' => 'Terminal UI (CLI/console)',
        'ai-orchestration' => 'AI orchestration',
        'testing' => 'Testing utilities',
    ];

    /**
     * Five business-type default sets. `stackra new --preset=<type>`
     * preselects these capabilities in the multiselect.
     *
     * @var array<string, array<int, string>>
     */
    public const BUSINESS_TYPE_DEFAULTS = [
        'salon' => ['auth-identity', 'multi-tenancy', 'notifications', 'payments'],
        'gym' => ['auth-identity', 'multi-tenancy', 'access-control', 'notifications', 'payments', 'entitlements'],
        'academy' => ['auth-identity', 'multi-tenancy', 'access-control', 'notifications', 'payments', 'approvals-delegation'],
        'clinic' => ['auth-identity', 'multi-tenancy', 'access-control', 'consent', 'audit-trails', 'notifications'],
        'custom' => [],
    ];

    /**
     * Human-readable labels for the five business types.
     *
     * @var array<string, string>
     */
    public const BUSINESS_TYPE_LABELS = [
        'salon' => 'Salon / Personal care',
        'gym' => 'Gym / Fitness',
        'academy' => 'Sports academy / Coaching',
        'clinic' => 'Clinic / Healthcare',
        'custom' => 'Custom (pick everything manually)',
    ];

    public function __construct(private readonly CatalogReader $reader) {}

    /**
     * @return array<string, string>
     */
    public function allCapabilityGroups(): array
    {
        return self::CAPABILITY_GROUPS;
    }

    /**
     * @return array<int, string>
     */
    public function defaultsForBusinessType(string $type): array
    {
        return self::BUSINESS_TYPE_DEFAULTS[$type] ?? [];
    }

    /**
     * @return array<string, string>
     */
    public function businessTypes(): array
    {
        return self::BUSINESS_TYPE_LABELS;
    }

    /**
     * Resolve a set of capability keys into a deduplicated
     * {@see CatalogSelection} of packages.
     *
     * @param  array<int, string>  $capabilities
     */
    public function resolvePackages(array $capabilities): CatalogSelection
    {
        $seen = [];
        $matched = [];
        foreach ($this->reader->all() as $entry) {
            foreach ($capabilities as $cap) {
                if (in_array($cap, $entry->capabilities, true) && ! isset($seen[$entry->name])) {
                    $seen[$entry->name] = true;
                    $matched[] = $entry;

                    break;
                }
            }
        }

        return new CatalogSelection($matched);
    }
}
