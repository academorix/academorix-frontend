<?php

declare(strict_types=1);

/**
 * HasStatus Trait.
 *
 * Generic status management with enum-based transition validation.
 * Works with any PHP 8.1+ backed enum that implements allowedTransitions()
 * and canTransitionTo() methods. No external state machine library required.
 *
 * The model must define a statusEnum() method returning the fully qualified
 * enum class name. The enum must be a BackedEnum (string or int backed)
 * with the following methods:
 *
 * ```php
 * enum OrderStatus: string
 * {
 *     case Pending = 'pending';
 *     case Processing = 'processing';
 *     case Shipped = 'shipped';
 *     case Cancelled = 'cancelled';
 *
 *     public function allowedTransitions(): array
 *     {
 *         return match ($this) {
 *             self::Pending => [self::Processing, self::Cancelled],
 *             self::Processing => [self::Shipped, self::Cancelled],
 *             self::Shipped => [],
 *             self::Cancelled => [],
 *         };
 *     }
 *
 *     public function canTransitionTo(self $target): bool
 *     {
 *         return in_array($target, $this->allowedTransitions(), true);
 *     }
 * }
 * ```
 *
 * ## Required Column:
 * - status (string, indexed)
 *
 * ## Usage:
 * ```php
 * use Academorix\Database\Concerns\Model\HasStatus;
 *
 * class Order extends Model
 * {
 *     use HasStatus;
 *
 *     public function statusEnum(): string { return OrderStatus::class; }
 *     public function statusDefault(): string { return OrderStatus::Pending->value; }
 * }
 *
 * $order = Order::create(['total' => 99.99]);
 * $order->currentStatus();                    // OrderStatus::Pending
 * $order->canTransitionTo(OrderStatus::Processing); // true
 * $order->transitionTo(OrderStatus::Processing);
 *
 * // Query by status:
 * Order::whereStatus(OrderStatus::Pending)->get();
 * Order::whereStatusIn([OrderStatus::Pending, OrderStatus::Processing])->get();
 * ```
 *
 * @category Concerns
 *
 * @since    2.0.0
 *
 * @see \BackedEnum
 */

namespace Academorix\Database\Concerns\Model;

use Illuminate\Database\Eloquent\Model;

/**
 * Generic status management with enum-based transition validation.
 */
trait HasStatus
{
    /**
     * Boot the HasStatus trait.
     *
     * Registers an Eloquent creating hook that sets the default status
     * from statusDefault() if the status column is not already populated.
     *
     * @return void
     */
    public static function bootHasStatus(): void
    {
        // Read attribute configuration (if present)
        $config = null;
        $forClass = \Academorix\Database\Support\AttributeReader::forClass(static::class);
        foreach ($forClass->classAttributes as $attr) {
            if ($attr instanceof \Academorix\Database\Attributes\StatusColumn) {
                $config = $attr;
                break;
            }
        }

        static::creating(function (Model $model) use ($config): void {
            /** @var Model&HasStatus $model */
            $column = $config?->column ?? $model->statusColumn();

            // Only set default if status was not explicitly provided
            if (empty($model->getAttribute($column))) {
                if ($config?->default !== null) {
                    $model->setAttribute($column, $config->default);
                } else {
                    $model->setAttribute($column, $model->statusDefault());
                }
            }
        });
    }

    // =========================================================================
    // Configuration (override in model)
    // =========================================================================

    /**
     * Get the fully qualified enum class name for this model's status.
     *
     * The enum must be a BackedEnum with allowedTransitions() and
     * canTransitionTo() methods. When the #[StatusColumn] attribute is
     * present, its enum value takes priority.
     *
     * @return string The enum class name (e.g., OrderStatus::class).
     */
    public function statusEnum(): string
    {
        $forClass = \Academorix\Database\Support\AttributeReader::forClass(static::class);
        foreach ($forClass->classAttributes as $attr) {
            if ($attr instanceof \Academorix\Database\Attributes\StatusColumn) {
                return $attr->enum;
            }
        }

        throw new \LogicException(sprintf(
            'Model [%s] must either define statusEnum() or use the #[StatusColumn] attribute.',
            static::class,
        ));
    }

    /**
     * Get the column name that stores the status value.
     *
     * @return string
     */
    public function statusColumn(): string
    {
        $forClass = \Academorix\Database\Support\AttributeReader::forClass(static::class);
        foreach ($forClass->classAttributes as $attr) {
            if ($attr instanceof \Academorix\Database\Attributes\StatusColumn) {
                return $attr->column;
            }
        }

        return 'status';
    }

    /**
     * Get the default status value for new records.
     *
     * Should return the backed value of the default enum case.
     *
     * @return string The default status value.
     */
    public function statusDefault(): string
    {
        $enumClass = $this->statusEnum();
        $cases = $enumClass::cases();

        // Return the first enum case's value as the default
        return $cases[0]->value;
    }

    // =========================================================================
    // Operations
    // =========================================================================

    /**
     * Transition the model to a new status.
     *
     * Validates the transition against the enum's canTransitionTo() method.
     * Throws a LogicException if the transition is not allowed.
     *
     * @param  string|\BackedEnum  $status  The target status (enum case or backed value).
     * @return static
     *
     * @throws \LogicException When the transition is not allowed.
     */
    public function transitionTo(string|\BackedEnum $status): static
    {
        $targetEnum = $this->resolveStatusEnum($status);
        $currentEnum = $this->currentStatus();

        // Validate the transition is allowed
        if (! $currentEnum->canTransitionTo($targetEnum)) {
            throw new \LogicException(sprintf(
                'Cannot transition from [%s] to [%s] on [%s].',
                $currentEnum->value,
                $targetEnum->value,
                static::class,
            ));
        }

        $this->setAttribute($this->statusColumn(), $targetEnum->value);
        $this->save();

        return $this;
    }

    /**
     * Determine if the model can transition to the given status.
     *
     * @param  string|\BackedEnum  $status  The target status to check.
     * @return bool
     */
    public function canTransitionTo(string|\BackedEnum $status): bool
    {
        $targetEnum = $this->resolveStatusEnum($status);
        $currentEnum = $this->currentStatus();

        return $currentEnum->canTransitionTo($targetEnum);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    /**
     * Get the current status as an enum instance.
     *
     * @return \BackedEnum The current status enum case.
     */
    public function currentStatus(): \BackedEnum
    {
        $enumClass = $this->statusEnum();
        $value = $this->getAttribute($this->statusColumn());

        return $enumClass::from($value);
    }

    /**
     * Determine if the model's current status matches the given status.
     *
     * @param  string|\BackedEnum  $status  The status to compare against.
     * @return bool
     */
    public function isStatus(string|\BackedEnum $status): bool
    {
        $targetEnum = $this->resolveStatusEnum($status);

        return $this->currentStatus() === $targetEnum;
    }

    /**
     * Determine if the model's current status matches any of the given statuses.
     *
     * @param  array<string|\BackedEnum>  $statuses  The statuses to compare against.
     * @return bool
     */
    public function isAnyStatus(array $statuses): bool
    {
        $currentEnum = $this->currentStatus();

        foreach ($statuses as $status) {
            $targetEnum = $this->resolveStatusEnum($status);

            if ($currentEnum === $targetEnum) {
                return true;
            }
        }

        return false;
    }

    // =========================================================================
    // Scopes
    // =========================================================================

    /**
     * Scope to records with the given status.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<static>  $query
     * @param  string|\BackedEnum  $status  The status to filter by.
     * @return \Illuminate\Database\Eloquent\Builder<static>
     */
    public function scopeWhereStatus($query, string|\BackedEnum $status)
    {
        $value = $status instanceof \BackedEnum ? $status->value : $status;

        return $query->where($this->statusColumn(), $value);
    }

    /**
     * Scope to records with any of the given statuses.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<static>  $query
     * @param  array<string|\BackedEnum>  $statuses  The statuses to filter by.
     * @return \Illuminate\Database\Eloquent\Builder<static>
     */
    public function scopeWhereStatusIn($query, array $statuses)
    {
        $values = array_map(
            fn(string|\BackedEnum $s) => $s instanceof \BackedEnum ? $s->value : $s,
            $statuses,
        );

        return $query->whereIn($this->statusColumn(), $values);
    }

    /**
     * Scope to records that do NOT have the given status.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<static>  $query
     * @param  string|\BackedEnum  $status  The status to exclude.
     * @return \Illuminate\Database\Eloquent\Builder<static>
     */
    public function scopeWhereStatusNot($query, string|\BackedEnum $status)
    {
        $value = $status instanceof \BackedEnum ? $status->value : $status;

        return $query->where($this->statusColumn(), '!=', $value);
    }

    // =========================================================================
    // Internal
    // =========================================================================

    /**
     * Resolve a status argument to its enum instance.
     *
     * Accepts either a BackedEnum instance or a string backed value.
     *
     * @param  string|\BackedEnum  $status  The status to resolve.
     * @return \BackedEnum The resolved enum case.
     *
     * @throws \ValueError When the string value doesn't match any enum case.
     */
    protected function resolveStatusEnum(string|\BackedEnum $status): \BackedEnum
    {
        if ($status instanceof \BackedEnum) {
            return $status;
        }

        $enumClass = $this->statusEnum();

        return $enumClass::from($status);
    }
}
