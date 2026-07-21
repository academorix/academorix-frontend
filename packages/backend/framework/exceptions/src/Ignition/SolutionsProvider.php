<?php

/**
 * @file packages/exceptions/src/Ignition/SolutionsProvider.php
 *
 * @description
 * Deterministic solution provider for
 * {@see \Stackra\Exceptions\Exception} subclasses.
 * Spatie Ignition (bundled with `spatie/laravel-ignition` in local
 * dev) calls `canSolve()` on every registered provider for every
 * unhandled throwable; every provider that says yes contributes
 * solutions shown on the Ignition error page.
 *
 * ## Deterministic vs. AI
 *
 * This class handles the exceptions we already understand — a
 * `ConfigurationException` always wants the same "check Doppler"
 * hint. The AI-powered counterpart
 * ({@see AiSolutionsProvider}) handles the long tail of
 * un-mapped 5xx errors where a generic pattern isn't useful.
 *
 * Both providers are registered when Spatie Ignition is loaded in
 * the runtime — see
 * {@see \Stackra\Exceptions\Providers\ExceptionsServiceProvider::registerIgnitionSolutions()}.
 *
 * ## Adding new deterministic solutions
 *
 * Add a case to the `match` in {@see getSolutions()}. Each case
 * should return a `SuggestionSolution` with a short, actionable
 * `description` — assume the developer already sees the stack
 * trace, so answer the "what do I do next?" question.
 */

declare(strict_types=1);

namespace Stackra\Exceptions\Ignition;

use Stackra\Exceptions\Exception;
use Stackra\Exceptions\Auth\FeatureDisabledException;
use Stackra\Exceptions\Domain\TenantException;
use Stackra\Exceptions\Infrastructure\ConfigurationException;
use Stackra\Exceptions\Infrastructure\IntegrationException;
use Spatie\Ignition\Contracts\HasSolutionsForThrowable;
use Spatie\Ignition\Contracts\Solution;
use Spatie\Ignition\Solutions\SuggestionSolution;
use Throwable;

final class SolutionsProvider implements HasSolutionsForThrowable
{
    public function canSolve(Throwable $throwable): bool
    {
        return $throwable instanceof Exception;
    }

    /** @return list<Solution> */
    public function getSolutions(Throwable $throwable): array
    {
        // `canSolve()` already guarantees this — but we assert it
        // here so phpstan/level-8 sees the narrower type below.
        if (! $throwable instanceof Exception) {
            return [];
        }

        return match (true) {
            $throwable instanceof ConfigurationException => [$this->configurationSolution($throwable)],
            $throwable instanceof IntegrationException => [$this->integrationSolution($throwable)],
            $throwable instanceof FeatureDisabledException => [$this->featureFlagSolution($throwable)],
            $throwable instanceof TenantException => [$this->tenantSolution($throwable)],
            default => [$this->genericSolution($throwable)],
        };
    }

    // ---------------------------------------------------------------
    // Per-class solutions.
    // ---------------------------------------------------------------

    private function configurationSolution(ConfigurationException $e): Solution
    {
        $key = (string) ($e->context()['config_key'] ?? 'unknown.key');

        return new SuggestionSolution(
            title: 'Missing / invalid configuration value',
            description: "The runtime tried to read `{$key}` but got null / empty / invalid. Check Doppler and re-run `composer setup` in the affected app.",
            links: [
                'Doppler CLI docs' => 'https://docs.doppler.com/docs/cli',
                'Config authoring guide' => '../../docs/architecture.md',
            ],
        );
    }

    private function integrationSolution(IntegrationException $e): Solution
    {
        $service = (string) ($e->context()['service'] ?? 'unknown');

        return new SuggestionSolution(
            title: "Upstream service [{$service}] returned an error",
            description: "Check the upstream status page for {$service}. Then confirm credentials in Doppler match the environment (`.env` should be empty in this monorepo).",
            links: [
                'Runbook index' => '../../docs/adr/',
            ],
        );
    }

    private function featureFlagSolution(FeatureDisabledException $e): Solution
    {
        $flag = (string) ($e->context()['flag'] ?? 'unknown');

        return new SuggestionSolution(
            title: "Feature flag [{$flag}] is off",
            description: "Enable the flag for the current tenant or user, or gate the code with a check so this exception isn't thrown when the flag is deliberately off.",
        );
    }

    private function tenantSolution(TenantException $e): Solution
    {
        return new SuggestionSolution(
            title: 'Tenant context missing or mismatched',
            description: 'The request did not carry a resolvable tenant, or it tried to touch a resource on a different tenant. Confirm the tenancy middleware is registered and that the caller\'s token is scoped correctly.',
        );
    }

    private function genericSolution(Exception $e): Solution
    {
        return new SuggestionSolution(
            title: "Stackra error: {$e->errorCode()}",
            description: sprintf(
                'Severity: %s. Category: %s. Correlation id: %s. See docs/adr/0002-exception-handling.md for the full catalogue.',
                $e->severity()->value,
                $e->category()->value,
                $e->correlationId() ?? 'n/a',
            ),
        );
    }
}
