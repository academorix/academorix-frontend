<?php

declare(strict_types=1);

namespace Stackra\Invitations\Casts;

use Stackra\Invitations\Contracts\Services\InvitationTargetRegistryInterface;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Cast for the polymorphic `target_type` column.
 *
 * The invitations module never knows the concrete class of a target
 * (`tenant`, `team`, `athlete`, `federation`, ...); consumer modules
 * register the string key + concrete class with
 * {@see InvitationTargetRegistryInterface} at boot. This cast is the
 * seam that translates the stored key to the target's morph-map
 * class on hydrate and vice versa on save.
 *
 * @category Invitations
 *
 * @since    0.1.0
 *
 * @implements CastsAttributes<string|null, string|null>
 */
final class InvitationTargetCast implements CastsAttributes
{
    /**
     * Hydrate — the stored value is the morph key; return it as-is.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        return $value === null ? null : (string) $value;
    }

    /**
     * Save — accept either a morph key or an FQCN and coerce to the
     * canonical key registered on the target registry.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        $raw = (string) $value;
        if ($raw === '') {
            return null;
        }

        /** @var InvitationTargetRegistryInterface $registry */
        $registry = \app(InvitationTargetRegistryInterface::class);

        return $registry->normalise($raw);
    }
}
