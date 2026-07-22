<?php

/**
 * @file packages/backend/notifications/notifications-push/database/migrations/2026_07_22_000000_drop_application_id_from_push_subscriptions_table.php
 *
 * @description
 * Drop `application_id` from the `push_subscriptions` table per ADR-0031 §D3.
 *
 * The `push_subscriptions` row cascades through its legitimate parent — no attribution
 * is lost by removing the direct `application_id` column. Every downstream
 * consumer that used to read `$row->application_id` reads through the
 * parent relationship instead.
 *
 * This migration ALSO rewrites the composite unique index(es) that referenced application_id — per ADR-0031 §D3. The DB refuses to drop a column referenced by an index, so the sequence is: drop old index → drop column → recreate narrower index.
 *
 * ## Related
 *
 *   * ADR-0031 §D3 — the mandate this migration executes.
 *   * `.kiro/steering/tenancy-columns.md §2` — the 12-row named list that
 *     excludes this row.
 *   * `.kiro/steering/tenancy-columns.md §9b` — the closed-rows register
 *     the auditor reads.
 */

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Stackra\Notifications\Push\Contracts\Data\PushSubscriptionInterface;

return new class() extends Migration
{
    /**
     * Run the migration.
     */
    public function up(): void
    {
        Schema::table(PushSubscriptionInterface::TABLE, function (Blueprint $table): void {
            // Step 1: drop the two composite indexes that reference application_id.
            //         The column drop below fails if any index still references it.
            $table->dropUnique('push_subscriptions_user_app_fingerprint_unique');
            $table->dropIndex('push_subscriptions_user_app_active_index');

            // Step 2: drop the column itself. Application cascades through
            //         `users.application_id` per ADR-0031 §D3 row 9.
            $table->dropColumn(PushSubscriptionInterface::ATTR_APPLICATION_ID);

            // Step 3: recreate the narrower composite indexes.
            //         Natural key becomes UNIQUE(user_id, device_token_fingerprint).
            $table->unique(
                [
                    PushSubscriptionInterface::ATTR_USER_ID,
                    PushSubscriptionInterface::ATTR_DEVICE_TOKEN_FINGERPRINT,
                ],
                'push_subscriptions_user_fingerprint_unique',
            );
            $table->index(
                [PushSubscriptionInterface::ATTR_USER_ID],
                'push_subscriptions_user_active_index',
            );
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::table(PushSubscriptionInterface::TABLE, function (Blueprint $table): void {
            // Step 1: drop the narrower indexes we created in up().
            $table->dropUnique('push_subscriptions_user_fingerprint_unique');
            $table->dropIndex('push_subscriptions_user_active_index');

            // Step 2: add application_id back.
            $table->uuid(PushSubscriptionInterface::ATTR_APPLICATION_ID)->nullable();

            // Step 3: recreate the WIDER indexes that included application_id.
            //         Populating rows is out of scope — up() zeroed the column;
            //         down() only restores the shape.
            $table->unique(
                [
                    PushSubscriptionInterface::ATTR_USER_ID,
                    PushSubscriptionInterface::ATTR_APPLICATION_ID,
                    PushSubscriptionInterface::ATTR_DEVICE_TOKEN_FINGERPRINT,
                ],
                'push_subscriptions_user_app_fingerprint_unique',
            );
            $table->index(
                [
                    PushSubscriptionInterface::ATTR_USER_ID,
                    PushSubscriptionInterface::ATTR_APPLICATION_ID,
                ],
                'push_subscriptions_user_app_active_index',
            );
        });
    }
};
