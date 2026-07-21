<?php

declare(strict_types=1);

namespace Stackra\Coupon\Services;

use Stackra\Coupon\Contracts\Data\CouponInterface;
use Stackra\Coupon\Contracts\Repositories\CouponRepositoryInterface;
use Stackra\Coupon\Contracts\Services\CodeGeneratorInterface;
use Illuminate\Container\Attributes\Scoped;
use RuntimeException;

/**
 * Cryptographically-random coupon-code generator.
 *
 * Uses a 32-char base-32 alphabet chosen for readability + phone-
 * dictation ergonomics: no `0` / `O`, no `1` / `I` / `L`, no `U` /
 * `V` (visually confusable). Each character carries 5 bits of
 * entropy — a 10-char code has 50 bits of entropy which gives a
 * collision probability under 10^-8 up to 1 million codes per tenant.
 *
 * Collision-avoidance loop tries 10 times against the tenant's
 * existing codes; throws `RuntimeException` on total failure
 * (indicates the tenant has consumed the code space at this
 * length — the operator UI surfaces this as "bump length").
 *
 * `#[Scoped]` — reads active tenant scope through injected repo.
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[Scoped]
final class CodeGenerator implements CodeGeneratorInterface
{
    /**
     * 32-char alphabet — omits 0/O/1/I/L/U/V for readability.
     * Callers can rely on the alphabet being uppercase and
     * containing no ambiguous glyphs.
     */
    private const string ALPHABET = 'ABCDEFGHJKMNPQRSTWXYZ23456789';

    /**
     * Number of collision-avoidance retries. Ten tries against a
     * fresh code space cover a code-consumption fraction under 90%.
     */
    private const int MAX_ATTEMPTS = 10;

    public function __construct(
        private readonly CouponRepositoryInterface $coupons,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function generate(string $tenantId, int $length = 10, string $prefix = ''): string
    {
        $length = max(6, $length); // Reject weakly-random shorts.

        for ($attempt = 0; $attempt < self::MAX_ATTEMPTS; $attempt++) {
            $candidate = $prefix . $this->randomCode($length);
            if (! $this->existsForTenant($tenantId, $candidate)) {
                return $candidate;
            }
        }

        throw new RuntimeException(sprintf(
            'CodeGenerator: could not find a collision-free code for tenant "%s" after %d attempts — bump length.',
            $tenantId,
            self::MAX_ATTEMPTS,
        ));
    }

    /**
     * Emit `$length` random characters from the alphabet using
     * `random_int` (CSPRNG). Not `mt_rand` — we care about the
     * unpredictability guarantee for the anti-guessing property.
     */
    private function randomCode(int $length): string
    {
        $out = '';
        $max = strlen(self::ALPHABET) - 1;
        for ($i = 0; $i < $length; $i++) {
            $out .= self::ALPHABET[random_int(0, $max)];
        }

        return $out;
    }

    /**
     * True when the candidate code already exists for the tenant.
     * Case-insensitive match — a coupon typed `abcd1234` collides
     * with a stored `ABCD1234`.
     */
    private function existsForTenant(string $tenantId, string $code): bool
    {
        return $this->coupons
            ->getModel()
            ->newQuery()
            ->where(CouponInterface::ATTR_TENANT_ID, $tenantId)
            ->whereRaw('lower(' . CouponInterface::ATTR_CODE . ') = ?', [strtolower($code)])
            ->exists();
    }
}
