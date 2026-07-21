<?php

declare(strict_types=1);

namespace Stackra\ServiceAccounts\Contracts\Services;

use Stackra\Auth\Data\SignedJwtData;
use Stackra\ServiceAccounts\Models\ServiceAccount;
use Stackra\ServiceAccounts\Services\ServiceAccountJwtIssuer;
use Illuminate\Container\Attributes\Bind;

/**
 * Service contract for the ServiceAccount JWT issuer.
 *
 * Bridges the SA row (which owns `signer_kid`, `application_id`,
 * `tenant_id`) to `stackra/auth`'s HS256 signer. The issuer
 * assembles a payload with `purpose = service_account`, chooses a
 * TTL from the module config or an explicit override, and hands
 * off to {@see \Stackra\Auth\Contracts\Services\JwtSignerInterface}.
 *
 * @category ServiceAccounts
 *
 * @since    0.1.0
 */
#[Bind(ServiceAccountJwtIssuer::class)]
interface ServiceAccountJwtIssuerInterface
{
    /**
     * Issue a signed JWT for a service account.
     *
     * @param  ServiceAccount    $account          Row to sign for. Assumed active + not expired.
     * @param  list<string>      $audiences        Downstream services that will verify. At least one entry.
     * @param  int|null          $ttlSeconds       Override the default TTL (300s). Null uses the config default.
     * @param  list<string>|null $permissions      Optional compact-permissions to bake into the payload.
     * @param  string            $trigger          Observability tag: `exchange`, `test`, `background`.
     *
     * @return SignedJwtData  The compact JWT + echoed claims.
     *
     * @throws \Stackra\Auth\Exceptions\JwtSigningKeyUnavailableException
     */
    public function issue(
        ServiceAccount $account,
        array $audiences,
        ?int $ttlSeconds = null,
        ?array $permissions = null,
        string $trigger = 'exchange',
    ): SignedJwtData;
}
