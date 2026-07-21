<?php

declare(strict_types=1);

namespace Stackra\Domains\Observers;

use Stackra\Domains\Contracts\Data\DomainInterface;
use Stackra\Domains\Contracts\Data\DomainRecordInterface;
use Stackra\Domains\Enums\DnsRecordStatus;
use Stackra\Domains\Enums\DnsRecordType;
use Stackra\Domains\Enums\DomainKind;
use Stackra\Domains\Enums\DomainVerificationMethod;
use Stackra\Domains\Enums\SslStatus;
use Stackra\Domains\Events\DomainAdded;
use Stackra\Domains\Events\DomainRemoved;
use Stackra\Domains\Jobs\VerifyDomainDnsJob;
use Stackra\Domains\Models\Domain;
use Stackra\Domains\Models\DomainRecord;
use Illuminate\Support\Str;

/**
 * Lifecycle side effects on {@see Domain}.
 *
 * ## Responsibilities
 *
 *   - `creating` — generate the verification token; default
 *     `verification_method`, `ssl_status`.
 *   - `created`  — seed the expected {@see DomainRecord} rows
 *     (TXT verification + CNAME) and dispatch
 *     {@see VerifyDomainDnsJob} with a 30s delay so DNS has a chance
 *     to propagate.
 *   - `updating` — enforce single-primary invariant.
 *   - `deleted`  — emit {@see DomainRemoved}.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
final class DomainObserver
{
    /**
     * `creating` — seed defaults + generate the verification token.
     */
    public function creating(Domain $domain): void
    {
        if (empty($domain->{DomainInterface::ATTR_VERIFICATION_TOKEN})) {
            $bytes = (int) \config('domains.verification.token_bytes', 32);
            $domain->{DomainInterface::ATTR_VERIFICATION_TOKEN} = \bin2hex(\random_bytes($bytes));
        }

        if ($domain->{DomainInterface::ATTR_VERIFICATION_METHOD} === null) {
            $domain->{DomainInterface::ATTR_VERIFICATION_METHOD} = DomainVerificationMethod::DnsTxt;
        }

        if ($domain->{DomainInterface::ATTR_SSL_STATUS} === null) {
            $domain->{DomainInterface::ATTR_SSL_STATUS} = SslStatus::Pending;
        }

        if ($domain->{DomainInterface::ATTR_KIND} === null) {
            $domain->{DomainInterface::ATTR_KIND} = DomainKind::Custom;
        }
    }

    /**
     * `created` — seed the expected {@see DomainRecord} rows for the
     * verification method + dispatch {@see VerifyDomainDnsJob}.
     */
    public function created(Domain $domain): void
    {
        // Subdomain kind — auto-issued, no DNS verification needed.
        if ($domain->{DomainInterface::ATTR_KIND} === DomainKind::Subdomain) {
            $domain->{DomainInterface::ATTR_VERIFIED_AT} = \now();
            $domain->saveQuietly();

            DomainAdded::dispatch($domain);

            return;
        }

        $this->seedExpectedRecords($domain);

        // 30s delay lets the customer's DNS propagate before the first check.
        VerifyDomainDnsJob::dispatch((string) $domain->getKey())->delay(\now()->addSeconds(30));

        DomainAdded::dispatch($domain);
    }

    /**
     * `updating` — when this row transitions to primary, demote every
     * sibling in the same tenant.
     */
    public function updating(Domain $domain): void
    {
        $becomingPrimary = $domain->isDirty(DomainInterface::ATTR_IS_PRIMARY)
            && (bool) $domain->{DomainInterface::ATTR_IS_PRIMARY};

        if (! $becomingPrimary) {
            return;
        }

        Domain::query()
            ->where(DomainInterface::ATTR_TENANT_ID, $domain->{DomainInterface::ATTR_TENANT_ID})
            ->where(DomainInterface::ATTR_ID, '!=', $domain->getKey())
            ->update([DomainInterface::ATTR_IS_PRIMARY => false]);
    }

    /**
     * `deleted` — emit `DomainRemoved`.
     */
    public function deleted(Domain $domain): void
    {
        DomainRemoved::dispatch(
            (string) $domain->{DomainInterface::ATTR_TENANT_ID},
            (string) $domain->getKey(),
            (string) $domain->{DomainInterface::ATTR_HOST},
        );
    }

    /**
     * Seed the expected DNS records for a Domain. The exact records
     * depend on the verification method + whether we're an apex or a
     * subdomain-under-customer domain.
     */
    private function seedExpectedRecords(Domain $domain): void
    {
        $host  = (string) $domain->{DomainInterface::ATTR_HOST};
        $token = (string) $domain->{DomainInterface::ATTR_VERIFICATION_TOKEN};

        // The public host we point CNAMEs at — configured per deploy.
        $platformHost = (string) \config('domains.platform_host', 'edge.stackra.app');

        // TXT verification record — expected at `_stackra.{host}`.
        $this->createRecord(
            $domain,
            DnsRecordType::Txt,
            '_stackra.' . $host,
            \sprintf('stackra-verification=%s', $token),
        );

        // CNAME to our edge — the record that actually routes traffic.
        // Uses `www.{host}` when the customer registered an apex; apex
        // domains need an ALIAS/ANAME which we cannot emit portably.
        $isApex     = \substr_count($host, '.') === 1;
        $cnameName  = $isApex ? 'www.' . $host : $host;

        $this->createRecord(
            $domain,
            DnsRecordType::Cname,
            $cnameName,
            $platformHost,
        );
    }

    /**
     * Persist one expected {@see DomainRecord} row.
     */
    private function createRecord(
        Domain $domain,
        DnsRecordType $type,
        string $name,
        string $expectedValue,
    ): void {
        DomainRecord::query()->create([
            DomainRecordInterface::ATTR_ID             => 'drc_' . Str::ulid()->toBase32(),
            DomainRecordInterface::ATTR_TENANT_ID      => $domain->{DomainInterface::ATTR_TENANT_ID},
            DomainRecordInterface::ATTR_DOMAIN_ID      => $domain->getKey(),
            DomainRecordInterface::ATTR_KIND           => $type->value,
            DomainRecordInterface::ATTR_NAME           => $name,
            DomainRecordInterface::ATTR_EXPECTED_VALUE => $expectedValue,
            DomainRecordInterface::ATTR_STATUS         => DnsRecordStatus::Unknown->value,
        ]);
    }
}
