<?php

/**
 * @file packages/compliance/architecture/src/PhpStan/RequireFeatureAttributeOnGatedActionRule.php
 *
 * @description
 * PHPStan rule: flag classes that document `@feature <name>` in
 * their docblock but don't carry a matching
 * `#[RequireFeature(name: <name>)]` attribute.
 *
 * Per Requirement 5.1 / 18.2 of the feature-flags spec, every
 * action gated on a feature flag SHOULD carry the attribute so
 * the routing package auto-attaches the `feature:<name>`
 * middleware. A docblock `@feature` reference without a matching
 * attribute is a silent drift risk — the flag is documented but
 * the runtime gate never wires up.
 */

declare(strict_types=1);

namespace Stackra\Architecture\PhpStan;

use PhpParser\Node;
use PhpParser\Node\Arg;
use PhpParser\Node\Expr\ClassConstFetch;
use PhpParser\Node\Identifier;
use PhpParser\Node\Name;
use PhpParser\Node\Scalar\String_;
use PhpParser\Node\Stmt\Class_;
use PHPStan\Analyser\Scope;
use PHPStan\Rules\IdentifierRuleError;
use PHPStan\Rules\Rule;
use PHPStan\Rules\RuleErrorBuilder;

/**
 * Ensure classes carrying `@feature <name>` also carry `#[RequireFeature(name: <name>)]`.
 *
 * @final
 * @implements Rule<Class_>
 */
final class RequireFeatureAttributeOnGatedActionRule implements Rule
{
    /**
     * FQN of the attribute the rule looks for.
     */
    private const string ATTRIBUTE_FQN = 'Stackra\\FeatureFlags\\Attributes\\RequireFeature';

    /**
     * The AST node type this rule inspects.
     *
     * @return class-string<Class_>
     */
    public function getNodeType(): string
    {
        return Class_::class;
    }

    /**
     * Compare the class's `@feature` docblock tag against its `#[RequireFeature]` attribute.
     *
     * @param  Node   $node   Current AST node — always a `Class_` per {@see getNodeType}.
     * @param  Scope  $scope  PHPStan analysis scope.
     * @return list<IdentifierRuleError>
     */
    public function processNode(Node $node, Scope $scope): array
    {
        if (! $node instanceof Class_) {
            return [];
        }

        $docFeature = $this->extractDocFeatureTag($node);
        if ($docFeature === null) {
            return [];
        }

        $attrFeature = $this->extractRequireFeatureAttribute($node);
        if ($attrFeature === $docFeature) {
            return [];
        }

        $className = $node->namespacedName !== null
            ? $node->namespacedName->toString()
            : (string) ($node->name?->toString() ?? '<anonymous>');

        $message = \sprintf(
            'Class `%s` documents `@feature %s` but is missing `#[RequireFeature(name: %s)]` — the routing gate will not attach without the attribute (Requirement 5.1, 18.2).',
            $className,
            $docFeature,
            \var_export($docFeature, true),
        );

        return [
            RuleErrorBuilder::message($message)
                ->identifier('feature_flags.gated_action_needs_attribute')
                ->line($node->getStartLine())
                ->tip('Add `#[\\Stackra\\FeatureFlags\\Attributes\\RequireFeature(name: \'' . $docFeature . '\')]` on the class so the routing package appends the `feature:<name>` middleware.')
                ->build(),
        ];
    }

    /**
     * Extract the `@feature <name>` tag from the class docblock.
     *
     * @param  Class_  $class  Class AST node.
     * @return string|null     Flag name from the docblock, or null when absent.
     */
    private function extractDocFeatureTag(Class_ $class): ?string
    {
        $doc = $class->getDocComment();
        if ($doc === null) {
            return null;
        }

        if (\preg_match('/@feature\s+([^\s*]+)/', $doc->getText(), $matches) === 1) {
            return \trim($matches[1]);
        }

        return null;
    }

    /**
     * Extract the flag name from the class's `#[RequireFeature]` attribute, if present.
     *
     * @param  Class_  $class  Class AST node.
     * @return string|null     Flag name from the attribute, or null when absent.
     */
    private function extractRequireFeatureAttribute(Class_ $class): ?string
    {
        foreach ($class->attrGroups as $group) {
            foreach ($group->attrs as $attribute) {
                if (! $this->nameMatchesAttribute($attribute->name)) {
                    continue;
                }

                return $this->firstStringArg($attribute->args);
            }
        }

        return null;
    }

    /**
     * Return true when the attribute name resolves to `RequireFeature`.
     *
     * @param  Name  $name  Attribute-name AST node.
     * @return bool
     */
    private function nameMatchesAttribute(Name $name): bool
    {
        $fqn      = $name->toString();
        $endsWith = 'RequireFeature';

        return $fqn === self::ATTRIBUTE_FQN
            || $fqn === $endsWith
            || \str_ends_with($fqn, '\\' . $endsWith);
    }

    /**
     * Return the first string argument value from an attribute call.
     *
     * @param  array<int, Arg>  $args  Attribute arguments.
     * @return string|null              String value of the first named `name:` / positional arg, or null.
     */
    private function firstStringArg(array $args): ?string
    {
        foreach ($args as $arg) {
            $value = $arg->value;

            if ($value instanceof String_) {
                return $value->value;
            }

            if ($value instanceof ClassConstFetch
                && $value->name instanceof Identifier
                && $value->name->toString() === 'class'
            ) {
                continue;
            }
        }

        return null;
    }
}
