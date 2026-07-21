<?php

declare(strict_types=1);

use Stackra\Domains\Contracts\Data\DomainRecordInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `domain_records` table.
 *
 * Expected DNS records for a Domain — diffed against real DNS by
 * `VerifyDomainDnsJob`. Cascades on Domain delete.
 */
return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(DomainRecordInterface::TABLE, function (Blueprint $table): void {
            $table->string(DomainRecordInterface::ATTR_ID, 64)->primary();

            $table->string(DomainRecordInterface::ATTR_TENANT_ID, 64);
            $table->foreign(DomainRecordInterface::ATTR_TENANT_ID)
                ->references('id')
                ->on('tenants')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string(DomainRecordInterface::ATTR_DOMAIN_ID, 64);
            $table->foreign(DomainRecordInterface::ATTR_DOMAIN_ID)
                ->references('id')
                ->on('domains')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string(DomainRecordInterface::ATTR_KIND, 8);
            $table->string(DomainRecordInterface::ATTR_NAME, 253);
            $table->text(DomainRecordInterface::ATTR_EXPECTED_VALUE);
            $table->text(DomainRecordInterface::ATTR_LAST_SEEN_VALUE)->nullable();
            $table->integer(DomainRecordInterface::ATTR_TTL_SECONDS)->nullable();
            $table->integer(DomainRecordInterface::ATTR_PRIORITY)->nullable();

            $table->string(DomainRecordInterface::ATTR_STATUS, 16)->default('unknown');
            $table->timestampTz(DomainRecordInterface::ATTR_LAST_CHECK_AT)->nullable();
            $table->timestampTz(DomainRecordInterface::ATTR_LAST_MATCHED_AT)->nullable();
            $table->text(DomainRecordInterface::ATTR_LAST_ERROR)->nullable();

            $table->jsonb(DomainRecordInterface::ATTR_METADATA)->nullable();

            $table->uuid(DomainRecordInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(DomainRecordInterface::ATTR_UPDATED_BY)->nullable();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            $table->unique(
                [
                    DomainRecordInterface::ATTR_DOMAIN_ID,
                    DomainRecordInterface::ATTR_KIND,
                    DomainRecordInterface::ATTR_NAME,
                ],
                'domain_records_unique',
            );

            $table->index(
                [DomainRecordInterface::ATTR_TENANT_ID, DomainRecordInterface::ATTR_DOMAIN_ID],
                'domain_records_tenant_domain_index',
            );

            $table->index(
                [DomainRecordInterface::ATTR_STATUS, DomainRecordInterface::ATTR_LAST_CHECK_AT],
                'domain_records_status_last_check_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(DomainRecordInterface::TABLE);
    }
};
