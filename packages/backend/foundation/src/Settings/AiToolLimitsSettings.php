<?php

/**
 * @file src/Settings/AiToolLimitsSettings.php
 *
 * @description
 * Cross-cutting caps for AI-tool result batches. Ported from
 * the recurring `DEFAULT_LIMIT` / `MAX_LIMIT` pair that appears
 * in ~15 AI tools across the old codebase (Athletics-Retention,
 * Facilities, Coaching, Documents, Staff, Awards, Finance,
 * Communication, Teams, Medical, Events, Geography, …).
 *
 * ## Why a shared setting
 *
 * Every AI tool that returns a list has the same shape:
 *   - a default batch size that keeps the LLM's context bounded
 *   - a hard ceiling that keeps a runaway prompt from asking for
 *     10,000 rows in one call.
 *
 * Pulling these to a single group lets a platform operator raise
 * or lower BOTH numbers for every tool at once (say, when moving
 * to a larger context window model) without touching each tool's
 * source.
 *
 * ## Group key
 *
 * `ai_tool_limits` — stored under
 * `scope_values.namespace='settings'` with keys
 * `ai_tool_limits.default_limit` and `ai_tool_limits.max_limit`.
 *
 * ## Scope
 *
 * `Tenant` — different tenant plans may allow different batch
 * sizes. Cascades to the system defaults when the tenant has no
 * stored override.
 */

declare(strict_types=1);

namespace Stackra\Foundation\Settings;

use Stackra\Settings\Attributes\AsSetting;
use Stackra\Settings\Attributes\SettingField;
use Stackra\Settings\Enums\ControlType;
use Stackra\Settings\Enums\SettingScope;

/**
 * Shared per-tool result-batch caps for AI tools.
 *
 * ## Usage
 *
 * ```php
 * // Inside an AI tool's execute() method:
 * $limit = min(
 *     (int) ($input['limit'] ?? $settings->get('ai_tool_limits.default_limit')),
 *     (int) $settings->get('ai_tool_limits.max_limit'),
 * );
 * ```
 *
 * ## Baseline values (20 / 100)
 *
 * - 20 rows/call keeps the tool's serialised JSON payload well
 *   under a 32k-token context, leaving room for the surrounding
 *   prompt + system message + the LLM's response.
 * - 100 rows/call is the point where the tool output alone
 *   consumes more tokens than the rest of the prompt combined —
 *   past that, the model's answer quality degrades faster than
 *   the extra context helps.
 */
#[AsSetting(
    group: 'ai_tool_limits',
    label: 'AI tool result limits',
    description: 'Default and maximum row-batch sizes returned by AI tools per invocation.',
    icon: 'sparkles',
    // Tenant-scoped so a paid plan can lift the ceiling without
    // affecting every other tenant on the platform.
    scope: SettingScope::Tenant,
    sortOrder: 110,
)]
final class AiToolLimitsSettings
{
    /**
     * Default number of rows an AI tool returns when the LLM
     * doesn't pass an explicit `limit` argument. Kept small
     * because a lazy prompt shouldn't burn a tenant's token
     * budget on a mega-response the model wasn't going to
     * reference anyway.
     */
    #[SettingField(
        controlType: ControlType::Number,
        label: 'Default result limit',
        description: 'Default number of rows an AI tool returns when the caller does not supply an explicit `limit`.',
        validation: ['integer', 'min:1', 'max:1000'],
        min: 1,
        max: 1000,
        step: 1,
        sortOrder: 10,
    )]
    public int $default_limit = 20;

    /**
     * Hard ceiling on caller-supplied `limit`. Tools clamp any
     * larger request down to this value silently — the model
     * doesn't need a 422; it just needs its answer.
     */
    #[SettingField(
        controlType: ControlType::Number,
        label: 'Maximum result limit',
        description: 'Ceiling on the caller-supplied `limit`. Tools clamp any larger request down to this value.',
        validation: ['integer', 'min:1', 'max:10000'],
        min: 1,
        max: 10000,
        step: 1,
        sortOrder: 20,
    )]
    public int $max_limit = 100;
}
