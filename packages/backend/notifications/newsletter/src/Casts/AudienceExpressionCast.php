<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Cast for the audience expression column.
 *
 * The expression is a rule-based JSON DSL — a map with keys `all`
 * (AND-combined predicates), `any` (OR-combined predicates), and
 * `none` (NAND-combined predicates), each holding a list of atomic
 * predicates evaluated by
 * {@see \Stackra\Newsletter\Services\DefaultAudienceEvaluator}.
 *
 * Stored as JSON — the cast normalises a `null` value to an empty
 * `all` map so downstream evaluators can always assume the three
 * keys exist.
 *
 * @implements CastsAttributes<array<string, mixed>, array<string, mixed>|string|null>
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class AudienceExpressionCast implements CastsAttributes
{
    /**
     * Cast raw JSON → normalised expression array on read.
     *
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): array
    {
        if ($value === null || $value === '') {
            return $this->emptyExpression();
        }

        if (\is_array($value)) {
            return $this->normalize($value);
        }

        /** @var mixed $decoded */
        $decoded = \json_decode((string) $value, true);
        if (! \is_array($decoded)) {
            return $this->emptyExpression();
        }

        return $this->normalize($decoded);
    }

    /**
     * Cast expression array → raw JSON on write.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): string
    {
        if ($value === null) {
            return (string) \json_encode($this->emptyExpression());
        }

        if (! \is_array($value)) {
            /** @var mixed $decoded */
            $decoded = \json_decode((string) $value, true);
            $value   = \is_array($decoded) ? $decoded : [];
        }

        /** @var array<string, mixed> $value */
        return (string) \json_encode($this->normalize($value));
    }

    /**
     * Coerce a raw expression map to the canonical three-key shape.
     *
     * @param  array<string, mixed>  $expression
     * @return array<string, mixed>
     */
    private function normalize(array $expression): array
    {
        return [
            'all'  => \is_array($expression['all'] ?? null) ? \array_values($expression['all']) : [],
            'any'  => \is_array($expression['any'] ?? null) ? \array_values($expression['any']) : [],
            'none' => \is_array($expression['none'] ?? null) ? \array_values($expression['none']) : [],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyExpression(): array
    {
        return ['all' => [], 'any' => [], 'none' => []];
    }
}
