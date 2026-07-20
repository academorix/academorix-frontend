<?php

/**
 * @file packages/compliance/architecture/src/PhpStan/NoDirectPennantAccessRule.php
 *
 * @description
 * PHPStan rule: forbid direct references to `Laravel\Pennant\Feature`
 * / `Laravel\Pennant\Contracts\Driver` outside the small set of
 * namespaces that own the Pennant seam.
 *
 * Per Requirement 4.9 of the feature-flags spec, every non-package
 * consumer routes through `FeatureCheckerInterface` (or the
 * `Feature::` facade) — never `Laravel\Pennant\Feature::` directly.
 * Direct references drift outcomes from the resolver's fixed
 * precedence chain and break Property 6 (facade equals contract).
 *
 * ## Allowed namespaces
 *
 *  - `Academorix\FeatureFlags\Checkers` — the `PennantFeatureChecker`
 *    implementation.
 *  - `Academorix\FeatureFlags\Registry` — `FeatureFlagDiscovery`
 *    wires Pennant's class-based resolver.
 *  - `Academorix\FeatureFlags\Providers` — reserved for future
 *    provider-level Pennant wiring.
 *
 * Every other namespace that references `Laravel\Pennant\*` symbols
 * fails this rule.
 */

declare(strict_types=1);

namespace Academorix\Architecture\PhpStan;

use PhpParser\Node;
use PhpParser\Node\Name;
use PHPStan\Analyser\Scope;
use PHPStan\Rules\IdentifierRuleError;
use PHPStan\Rules\Rule;
use PHPStan\Rules\RuleErrorBuilder;

/**
 * Ban direct `Laravel\Pennant\*` references outside the allow-list.
 *
 * @final
 * @implements Rule<Name>
 */
final class NoDirectPennantAccessRule implements Rule
{
    /**
     * Namespace prefixes allowed to import / reference `Laravel\Pennant\*`.
     *
     * @var list<string>
     */
    private const array ALLOWED_NAMESPACES = [
        'Academorix\\FeatureFlags\\Checkers',
        'Academorix\\FeatureFlags\\Registry',
        'Academorix\\FeatureFlags\\Providers',
    ];

    /**
     * Pennant symbol prefixes considered off-limits.
     *
     * @var list<string>
     */
    private const array BANNED_PREFIXES = [
        'Laravel\\Pennant\\',
    ];

    /**
     * The AST node type this rule inspects.
     *
     * @return class-string<Name>
     */
    public function getNodeType(): string
    {
        return Name::class;
    }

    /**
     * Inspect a name-reference node for a banned prefix outside the allow-list.
     *
     * @param  Node   $node   The current AST node — always a `Name` per {@see getNodeType}.
     * @param  Scope  $scope  PHPStan analysis scope.
     * @return list<IdentifierRuleError>
     */
    public function processNode(Node $node, Scope $scope): array
    {
        if (! $node instanceof Name) {
            return [];
        }

        $fqn = $node->toString();

        $isBanned = false;
        foreach (self::BANNED_PREFIXES as $prefix) {
            if (\str_starts_with($fqn, $prefix)) {
                $isBanned = true;
                break;
            }
        }

        if (! $isBanned) {
            return [];
        }

        $currentNamespace = $scope->getNamespace() ?? '';
        foreach (self::ALLOWED_NAMESPACES as $allowed) {
            if (\str_starts_with($currentNamespace, $allowed)) {
                return [];
            }
        }

        $message = \sprintf(
            'Direct Pennant reference `%s` in namespace `%s` is forbidden — route through `Academorix\\FeatureFlags\\Facades\\Feature` or inject `FeatureCheckerInterface` (Requirement 4.9).',
            $fqn,
            $currentNamespace,
        );

        return [
            RuleErrorBuilder::message($message)
                ->identifier('feature_flags.no_direct_pennant')
                ->line($node->getStartLine())
                ->tip('The feature-flags package owns the Pennant seam. Consumers depend on `FeatureCheckerInterface` so the resolver chain (KillSwitch → Override → Rollout → PlanGate → Default) stays authoritative.')
                ->build(),
        ];
    }
}
