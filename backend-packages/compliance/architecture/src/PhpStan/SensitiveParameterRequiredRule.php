<?php

/**
 * @file packages/architecture/src/PhpStan/SensitiveParameterRequiredRule.php
 *
 * @description
 * PHPStan rule: any method / function parameter whose name
 * matches a "sensitive" pattern (password, secret, token,
 * apiKey, accessKey, refreshToken — configurable) must carry
 * PHP's `#[\SensitiveParameter]` attribute. Missing → error.
 *
 * ## Why
 *
 * PHP 8.2's `#[SensitiveParameter]` redacts the parameter's
 * value in stack traces and `var_dump()` output. When a secret
 * is passed as an ordinary argument, a fatal error deep inside
 * a service can dump the plaintext value to logs, monitoring
 * dashboards, and error trackers. Marking every secret-bearing
 * parameter as sensitive is the cheapest possible defence — it
 * costs one attribute and cuts the biggest leak vector.
 *
 * ## Node type
 *
 * We inspect `PhpParser\Node\Stmt\ClassMethod`. Iterating at
 * the method level lets us walk parameters in declaration
 * order, produce one error per offending parameter, and
 * attribute each error to the parameter's own line number for
 * a pinpoint IDE experience.
 *
 * ## What counts as "sensitive"
 *
 * The rule accepts a configurable list of case-insensitive
 * substrings. Any parameter name that CONTAINS one of these
 * substrings is deemed sensitive. Default list:
 *
 *   - `password`
 *   - `secret`
 *   - `token`
 *   - `apiKey` / `apikey`
 *   - `accessKey` / `accesskey`
 *   - `refreshToken` / `refreshtoken`
 *
 * Case-insensitive matching handles both `camelCase` and
 * `snake_case` styles.
 *
 * ## Config
 *
 * Constructor arguments (see phpstan-extension.neon):
 *
 *   - `sensitivePatterns` — list of substrings; a parameter
 *                           name that contains any of them
 *                           (case-insensitive) requires the
 *                           attribute.
 *   - `sensitiveAttribute`— FQCN of the attribute expected.
 *                           Defaults to PHP's built-in
 *                           `SensitiveParameter`.
 *
 * The rule implements `PHPStan\Rules\Rule` for
 * `PhpParser\Node\Stmt\ClassMethod` nodes.
 */

declare(strict_types=1);

namespace Academorix\Architecture\PhpStan;

use PhpParser\Node;
use PhpParser\Node\Param;
use PhpParser\Node\Stmt\ClassMethod;
use PHPStan\Analyser\Scope;
use PHPStan\Rules\IdentifierRuleError;
use PHPStan\Rules\Rule;
use PHPStan\Rules\RuleErrorBuilder;

/**
 * Require `#[SensitiveParameter]` on secret-bearing arguments.
 *
 * @final
 */
final class SensitiveParameterRequiredRule implements Rule
{
    /**
     * PHP's built-in sensitive-parameter attribute FQCN.
     */
    private const string DEFAULT_SENSITIVE_ATTRIBUTE = 'SensitiveParameter';

    /**
     * Sensitivity patterns lowered once at construction so the
     * match loop stays tight.
     *
     * @var list<string>
     */
    private readonly array $normalisedPatterns;

    /**
     * @param  list<string>  $sensitivePatterns   Substrings that make a parameter name sensitive.
     * @param  string        $sensitiveAttribute  FQCN of the attribute the rule expects.
     */
    public function __construct(
        array $sensitivePatterns,
        private readonly string $sensitiveAttribute = self::DEFAULT_SENSITIVE_ATTRIBUTE,
    ) {
        // Case-insensitive match is done by lowering both
        // sides. Do the pattern-side work once.
        $this->normalisedPatterns = array_values(array_map(
            static fn (string $pattern): string => strtolower($pattern),
            $sensitivePatterns,
        ));
    }

    /**
     * PHPStan hook — declare the node type this rule listens to.
     */
    public function getNodeType(): string
    {
        return ClassMethod::class;
    }

    /**
     * Walk the method's parameters and flag every sensitive-
     * named parameter that lacks `#[SensitiveParameter]`.
     *
     * @return list<IdentifierRuleError>
     */
    public function processNode(Node $node, Scope $scope): array
    {
        if (! $node instanceof ClassMethod) {
            return [];
        }

        // No configured patterns → the rule is silently
        // disabled. Preserve config-driven off-switch behaviour.
        if ($this->normalisedPatterns === []) {
            return [];
        }

        $errors = [];
        $methodName = $node->name->toString();
        $className = $scope->getClassReflection()?->getName();

        foreach ($node->params as $param) {
            $paramName = $this->paramName($param);
            if ($paramName === null) {
                continue;
            }

            if (! $this->isSensitiveName($paramName)) {
                continue;
            }

            if ($this->hasSensitiveAttribute($param, $scope)) {
                continue;
            }

            $errors[] = RuleErrorBuilder::message(sprintf(
                'Parameter $%s on %s%s%s is sensitive but lacks #[%s] — mark it to prevent leaks in stack traces and var_dump output.',
                $paramName,
                $className ?? '(function)',
                $className !== null ? '::' : '',
                $methodName,
                $this->shortName($this->sensitiveAttribute),
            ))
                ->identifier('architecture.phpstan.sensitiveParameterRequired')
                ->line($param->getStartLine())
                ->build();
        }

        return $errors;
    }

    /**
     * `true` when the parameter's name (lowercased) contains
     * any configured sensitivity substring.
     */
    private function isSensitiveName(string $paramName): bool
    {
        $lower = strtolower($paramName);
        foreach ($this->normalisedPatterns as $needle) {
            if ($needle !== '' && str_contains($lower, $needle)) {
                return true;
            }
        }

        return false;
    }

    /**
     * `true` when `$param` carries an attribute whose resolved
     * FQCN equals the expected sensitive-parameter FQCN. Uses
     * `$scope->resolveName()` so aliased imports of the
     * attribute (`use SensitiveParameter as SP; #[SP]`) resolve
     * correctly.
     */
    private function hasSensitiveAttribute(Param $param, Scope $scope): bool
    {
        $expected = ltrim($this->sensitiveAttribute, '\\');

        foreach ($param->attrGroups as $group) {
            foreach ($group->attrs as $attribute) {
                $resolved = ltrim($scope->resolveName($attribute->name), '\\');
                if ($resolved === $expected) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Best-effort parameter name extraction. Property-promoted
     * ctor params still expose `->var` as a `Variable` with a
     * string `name`.
     */
    private function paramName(Param $param): ?string
    {
        $var = $param->var;
        if ($var instanceof Node\Expr\Variable && \is_string($var->name)) {
            return $var->name;
        }

        return null;
    }

    /**
     * Reduce a fully-qualified name to its final segment.
     */
    private function shortName(string $fqcn): string
    {
        $trimmed = ltrim($fqcn, '\\');
        $lastSlash = strrpos($trimmed, '\\');

        return $lastSlash === false ? $trimmed : substr($trimmed, $lastSlash + 1);
    }
}
