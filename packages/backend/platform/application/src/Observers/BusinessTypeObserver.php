<?php

declare(strict_types=1);

namespace Academorix\Application\Observers;

use Academorix\Application\Contracts\Data\BusinessTypeInterface;
use Academorix\Application\Events\BusinessTypeAdded;
use Academorix\Application\Events\BusinessTypeArchived;
use Academorix\Application\Exceptions\SystemRowImmutableException;
use Academorix\Application\Models\BusinessType;
use Illuminate\Support\Facades\Event;

/**
 * Model observer for {@see BusinessType}.
 *
 * Enforces the dual-source pattern's immutability guardrail (per
 * `.kiro/steering/enum-db-seed-dual-source.md` §Non-negotiable rules):
 * system rows (`is_system = true`) refuse `save` and `delete` UNLESS
 * the model's static mutation-allowed scope is open (opened by the
 * seeder + tests via `BusinessType::allowSystemMutation(...)`).
 *
 * The policy guards HTTP writes; this observer guards ORM writes.
 * Both are needed — either alone would leak.
 *
 * @category Application
 *
 * @since    0.1.0
 */
final class BusinessTypeObserver
{
    /**
     * @throws SystemRowImmutableException  When a save touches a system row outside the allowed scope.
     */
    public function saving(BusinessType $type): void
    {
        $this->guardSystemMutation($type, 'update');
    }

    /**
     * @throws SystemRowImmutableException
     */
    public function deleting(BusinessType $type): void
    {
        $this->guardSystemMutation($type, 'delete');
    }

    /**
     * Emit `BusinessTypeAdded` on creation of a tenant-custom row
     * (system rows land via the seeder and don't fire this event).
     */
    public function created(BusinessType $type): void
    {
        if ($type->{BusinessTypeInterface::ATTR_IS_SYSTEM} === true) {
            return;
        }
        Event::dispatch(new BusinessTypeAdded($type));
    }

    /**
     * Emit `BusinessTypeArchived` on soft-delete of a tenant custom.
     */
    public function deleted(BusinessType $type): void
    {
        if ($type->{BusinessTypeInterface::ATTR_IS_SYSTEM} === true) {
            return;
        }
        Event::dispatch(new BusinessTypeArchived($type));
    }

    /**
     * Refuse the write when the row is system AND the mutation scope isn't open.
     */
    private function guardSystemMutation(BusinessType $type, string $action): void
    {
        // Only guard mutations to EXISTING system rows. Initial creation
        // via the seeder must succeed — the seeder wraps it in the scope.
        if (! $type->exists) {
            // On create, allow only when the scope is open (seeder path).
            $isSystemOnCreate = $type->{BusinessTypeInterface::ATTR_IS_SYSTEM} === true;
            if ($isSystemOnCreate && ! BusinessType::isSystemMutationAllowed()) {
                throw SystemRowImmutableException::forAction(
                    model: BusinessType::class,
                    action: 'create-system',
                    rowId: (string) ($type->getKey() ?? '<new>'),
                );
            }
            return;
        }

        // Existing row — refuse when `is_system` was originally true.
        if ($type->getOriginal(BusinessTypeInterface::ATTR_IS_SYSTEM) !== true) {
            return;
        }

        if (BusinessType::isSystemMutationAllowed()) {
            return;
        }

        throw SystemRowImmutableException::forAction(
            model: BusinessType::class,
            action: $action,
            rowId: (string) $type->getKey(),
        );
    }
}
