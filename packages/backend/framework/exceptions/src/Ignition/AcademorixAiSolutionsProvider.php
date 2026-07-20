<?php

/**
 * @file packages/exceptions/src/Ignition/AcademorixAiSolutionsProvider.php
 *
 * @description
 * AI-augmented solutions for un-mapped throwables. Delegates to the
 * first-party {@link https://laravel.com/docs/13.x/ai-sdk Laravel AI
 * SDK} (`laravel/ai`) instead of hand-rolling an OpenAI HTTP client
 * so:
 *
 *   - Provider-swappable at zero code cost — set `AI_PROVIDER=openai`
 *     or `anthropic` or `ollama` in Doppler and this provider
 *     follows.
 *   - Multi-provider failover via the SDK's built-in fallback chain
 *     (rate limits / overload / insufficient credits).
 *   - `Agent::fake()` for tests — no more mocking `Http::post()`.
 *   - Same abstraction the rest of the monorepo will use, so we
 *     have one AI codepath, not two.
 *
 * ## When it fires
 *
 * Only registered when Ignition is loaded AND
 * `exceptions.ai_solutions.enabled` is truthy AND the AI SDK is
 * installed. Result: this class costs zero in prod, zero in CI, and
 * only makes network calls from a developer's laptop when they
 * explicitly opt in.
 *
 * ## Prompt seed
 *
 * The seed sent to the model is bounded to what's already visible
 * on the Ignition error page:
 *
 *   - Exception class + message.
 *   - Origin file + line.
 *   - Academorix `errorCode`, `category`, `severity`, `context`
 *     (masked — see below).
 *   - Last 5 stack frames (also masked).
 *
 * We do NOT send request bodies, form input, or user data. Even
 * within the seed, everything passes through
 * {@see \Academorix\Exceptions\Support\SensitiveDataMasker} so an
 * accidental bearer token in a stack-trace argument doesn't leave
 * the developer's laptop.
 *
 * ## Relationship to Ignition Pro AI
 *
 * `spatie/laravel-ignition` v2 ships its own Ignition Pro AI
 * provider that covers framework-native throwables well. This class
 * complements it — the domain context ({@see AcademorixException}'s
 * structured metadata) makes for a much richer prompt on our own
 * exception types than a bare stack trace can offer.
 */

declare(strict_types=1);

namespace Academorix\Exceptions\Ignition;

use Academorix\Exceptions\AcademorixException;
use Academorix\Exceptions\Support\SensitiveDataMasker;
use Illuminate\Contracts\Container\Container;
use Spatie\Ignition\Contracts\HasSolutionsForThrowable;
use Spatie\Ignition\Contracts\Solution;
use Spatie\Ignition\Solutions\SuggestionSolution;
use Throwable;

final class AcademorixAiSolutionsProvider implements HasSolutionsForThrowable
{
    /**
     * Non-domain 4xx errors don't merit an AI suggestion — a
     * "policy denied" hint is noise on the Ignition page and
     * wastes tokens.
     */
    private const MIN_STATUS_FOR_SUGGESTION = 500;

    /**
     * System instructions handed to the model. Kept short + strict
     * so token usage stays bounded and answers stay actionable.
     */
    private const AGENT_INSTRUCTIONS = <<<'TXT'
You are a senior Laravel + PHP engineer helping debug an exception in a monorepo backend.

Reply in ≤200 words. Structure:

  1. **Root-cause hypothesis** — one sentence.
  2. **Three-step fix** — numbered, concrete, actionable.

Do not apologise. Do not restate the exception. If you're uncertain, say so and suggest the diagnostic step.
TXT;

    public function __construct(
        private readonly Container $container,
        private readonly SensitiveDataMasker $masker,
    ) {
    }

    /**
     * Ignition contract — decide whether we have anything useful to
     * say about this throwable.
     */
    public function canSolve(Throwable $throwable): bool
    {
        if (! $this->enabled()) {
            return false;
        }

        if (! $this->sdkAvailable()) {
            return false;
        }

        // Skip client-caused errors — the fix is on the caller's
        // side, not the codebase's.
        if ($throwable instanceof AcademorixException && $throwable->httpStatus() < self::MIN_STATUS_FOR_SUGGESTION) {
            return false;
        }

        return true;
    }

    /**
     * Ignition contract — return the actual suggestion.
     *
     * @return list<Solution>
     */
    public function getSolutions(Throwable $throwable): array
    {
        try {
            $suggestion = $this->query($throwable);
        } catch (Throwable) {
            // AI providers can flap; a broken solution provider must
            // never take down the Ignition page itself.
            return [];
        }

        if ($suggestion === null || trim($suggestion) === '') {
            return [];
        }

        return [
            new SuggestionSolution(
                title: 'AI-suggested fix',
                description: $suggestion,
            ),
        ];
    }

    // ---------------------------------------------------------------
    // Internals
    // ---------------------------------------------------------------

    /**
     * Call `laravel/ai`'s anonymous agent with the seed built from
     * the throwable. Returns the raw text — the caller renders it as
     * a suggestion.
     */
    private function query(Throwable $e): ?string
    {
        // Deferred import so this file loads even when `laravel/ai`
        // isn't installed (dev-time only dep). The class-string is
        // safe to reference because the enabled() check gated us in.
        $agentFn = '\\Laravel\\Ai\\agent';
        if (! function_exists($agentFn)) {
            return null;
        }

        $prompt = $this->buildPrompt($e);

        // `agent(...)` builds an anonymous agent from instructions
        // and prompts it. Provider + model come from `config/ai.php`
        // — no hardcoded endpoint URLs.
        $response = $agentFn(instructions: self::AGENT_INSTRUCTIONS)->prompt($prompt);

        $text = (string) $response;

        return $text !== '' ? $text : null;
    }

    /**
     * Assemble the prompt seed — a compact JSON blob so the model
     * can decide what's relevant. Every value goes through the
     * masker first.
     */
    private function buildPrompt(Throwable $e): string
    {
        $seed = [
            'class' => $e::class,
            'message' => $this->masker->maskString($e->getMessage()),
            'file' => $this->masker->maskFilePath($e->getFile()),
            'line' => $e->getLine(),
            'trace' => $this->masker->maskTrace(array_slice($e->getTrace(), 0, 5)),
        ];

        if ($e instanceof AcademorixException) {
            $seed['errorCode'] = $e->errorCode();
            $seed['category'] = $e->category()->value;
            $seed['severity'] = $e->severity()->value;
            $seed['context'] = $this->masker->maskArray($e->context());
        }

        return "Exception details (JSON):\n"
            . json_encode(
                $seed,
                JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE,
            );
    }

    /**
     * Config gate. We deliberately DON'T use the SDK's `ai.enabled`
     * flag — that would tie our Ignition suggestions to whether
     * agents work at all in the app. Instead we key on our own
     * dedicated flag so devs can toggle solutions independently
     * from production agent traffic.
     */
    private function enabled(): bool
    {
        if (! $this->container->bound('config')) {
            return false;
        }

        return (bool) $this->container->make('config')->get('exceptions.ai_solutions.enabled', false);
    }

    /**
     * Runtime probe for the SDK.
     */
    private function sdkAvailable(): bool
    {
        return function_exists('\\Laravel\\Ai\\agent');
    }
}
