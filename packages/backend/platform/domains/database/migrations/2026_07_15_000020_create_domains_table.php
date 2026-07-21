<?php

declare(strict_types=1);

use Stackra\Domains\Contracts\Data\DomainInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `domains` table.
 *
 * Custom hostnames per Tenant. Carries `application_id` directly so
 * host resolution can `WHERE application_id = ? AND host = ?` before
 * knowing the tenant.
 */
return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(DomainInterface::TABLE, function (Blueprint $table): void {
            // Primary key — prefixed ULID `dom_<26 chars>`.
            $table->string(DomainInterface::ATTR_ID, 64)->primary();

            // Application + tenant boundaries.
            $table->string(DomainInterface::ATTR_APPLICATION_ID, 64);
            $table->foreign(DomainInterface::ATTR_APPLICATION_ID)
                ->references('id')
                ->on('applications')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->string(DomainInterface::ATTR_TENANT_ID, 64);
            $table->foreign(DomainInterface::ATTR_TENANT_ID)
                ->references('id')
                ->on('tenants')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            // Hostname + kind.
            $table->string(DomainInterface::ATTR_HOST, 253);
            $table->string(DomainInterface::ATTR_KIND, 16)->default('subdomain');
            $table->boolean(DomainInterface::ATTR_IS_PRIMARY)->default(false);

            // Verification state.
            $table->timestampTz(DomainInterface::ATTR_VERIFIED_AT)->nullable();
            $table->string(DomainInterface::ATTR_VERIFICATION_TOKEN, 128);
            $table->string(DomainInterface::ATTR_VERIFICATION_METHOD, 16)->default('dns_txt');
            $table->integer(DomainInterface::ATTR_VERIFICATION_ATTEMPTS)->default(0);
            $table->text(DomainInterface::ATTR_VERIFICATION_LAST_ERROR)->nullable();

            // SSL state.
            $table->string(DomainInterface::ATTR_SSL_STATUS, 16)->default('pending');
            $table->timestampTz(DomainInterface::ATTR_SSL_ISSUED_AT)->nullable();
            $table->timestampTz(DomainInterface::ATTR_SSL_EXPIRES_AT)->nullable();

            // Free-form metadata.
            $table->jsonb(DomainInterface::ATTR_METADATA)->nullable();

            // Userstamps + timestamps + soft delete.
            $table->uuid(DomainInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(DomainInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(DomainInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            // Host is unique per application.
            $table->unique(
                [DomainInterface::ATTR_APPLICATION_ID, DomainInterface::ATTR_HOST],
                'domains_application_host_unique',
            );

            $table->index(
                [DomainInterface::ATTR_TENANT_ID, DomainInterface::ATTR_CREATED_AT],
                'domains_tenant_created_at_index',
            );

            $table->index(
                DomainInterface::ATTR_SSL_EXPIRES_AT,
                'domains_ssl_expires_at_index',
            );

            $table->index(
                [DomainInterface::ATTR_TENANT_ID, DomainInterface::ATTR_IS_PRIMARY],
                'domains_tenant_primary_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(DomainInterface::TABLE);
    }
};
