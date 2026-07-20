<?php

declare(strict_types=1);

namespace Academorix\Coupon\Contracts\Services;

use Academorix\Coupon\Services\CodeGenerator;
use Illuminate\Container\Attributes\Bind;

/**
 * Unique coupon-code generator.
 *
 * Concrete: {@see CodeGenerator}.
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[Bind(CodeGenerator::class)]
interface CodeGeneratorInterface
{
    /**
     * Generate a new unique coupon code for a tenant.
     *
     * @param  string  $tenantId  Owning tenant — codes are unique per-tenant.
     * @param  int     $length    Number of alphanumeric characters (default 10).
     * @param  string  $prefix    Optional prefix (e.g. `SUMMER2026-`).
     *
     * @return string  Uppercase alphanumeric code (`ABCD1234EF`).
     *
     * @throws \RuntimeException  When the generator cannot find a
     *   collision-free code after 10 attempts (indicative of an
     *   overloaded tenant that has consumed the code space at the
     *   requested length — bump `$length` or hand a bespoke code).
     */
    public function generate(string $tenantId, int $length = 10, string $prefix = ''): string;
}
