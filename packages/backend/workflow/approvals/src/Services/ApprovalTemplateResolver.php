<?php

declare(strict_types=1);

namespace Stackra\Approvals\Services;

use Stackra\Approvals\Contracts\Data\ApprovalTemplateInterface;
use Stackra\Approvals\Contracts\Repositories\ApprovalTemplateRepositoryInterface;
use Stackra\Approvals\Contracts\Services\ApprovalTemplateResolverInterface;
use Stackra\Approvals\Contracts\Services\ExpressionLanguageAdapterInterface;
use Stackra\Approvals\Exceptions\ApprovalExpressionInvalidException;
use Stackra\Approvals\Exceptions\ApprovalExpressionTimeoutException;
use Stackra\Approvals\Models\ApprovalTemplate;
use Illuminate\Container\Attributes\Log;
use Illuminate\Container\Attributes\Scoped;
use Psr\Log\LoggerInterface;

/**
 * Reference implementation of
 * {@see \Stackra\Approvals\Contracts\Services\ApprovalTemplateResolverInterface}.
 *
 * Fetches every active template for a `(tenant, action_key)` pair,
 * sorts by `(priority DESC, version DESC)`, and returns the first
 * whose `when_expression` evaluates truthy — or null when nothing
 * applies. Fail-closed: a broken `when_expression` (invalid syntax
 * OR a rule-engine timeout) skips that template but does NOT fall
 * through to the next; it is logged as a security signal and the
 * next candidate is evaluated. This is the safest reading of the
 * "expression breakage should not weaken approval enforcement"
 * invariant — a broken template is neither "applies" nor
 * "definitely doesn't apply", so we skip + log + let the next
 * priority tier decide.
 *
 * `#[Scoped]` — reads active tenant / caller state.
 *
 * @category Approvals
 *
 * @since    0.1.0
 */
#[Scoped]
final class ApprovalTemplateResolver implements ApprovalTemplateResolverInterface
{
    public function __construct(
        private readonly ApprovalTemplateRepositoryInterface $templates,
        private readonly ExpressionLanguageAdapterInterface $expressions,
        #[Log('approvals')] private readonly LoggerInterface $log,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function resolveFor(string $tenantId, string $actionKey, array $payload): ?ApprovalTemplate
    {
        $candidates = $this->templates->findWhere([
            ApprovalTemplateInterface::ATTR_TENANT_ID  => $tenantId,
            ApprovalTemplateInterface::ATTR_ACTION_KEY => $actionKey,
            ApprovalTemplateInterface::ATTR_IS_ACTIVE  => true,
        ])
            ->sortByDesc(static function (ApprovalTemplate $t): array {
                // Two-key sort: priority DESC then version DESC. We
                // return a tuple; Collection::sortByDesc compares
                // element-wise thanks to PHP's array comparison.
                return [
                    (int) $t->getAttribute(ApprovalTemplateInterface::ATTR_PRIORITY),
                    (int) $t->getAttribute(ApprovalTemplateInterface::ATTR_VERSION),
                ];
            })
            ->values();

        foreach ($candidates as $template) {
            $expression = $template->getAttribute(ApprovalTemplateInterface::ATTR_WHEN_EXPRESSION);
            if (! is_string($expression) || $expression === '') {
                // Unconditional match — no `when` clause means
                // "always applies at this priority + tenant".
                return $template;
            }

            try {
                $result = $this->expressions->evaluate($expression, $payload);
            } catch (ApprovalExpressionInvalidException | ApprovalExpressionTimeoutException $e) {
                // Fail-closed: a broken expression must NOT
                // silently disable the template. Log + skip this
                // candidate + let the next priority tier decide.
                $this->log->warning('approval template `when_expression` failed; skipping', [
                    'template_id' => $template->getKey(),
                    'action_key'  => $actionKey,
                    'tenant_id'   => $tenantId,
                    'reason'      => $e::CODE,
                ]);
                continue;
            }

            if ((bool) $result === true) {
                return $template;
            }
        }

        return null;
    }
}
