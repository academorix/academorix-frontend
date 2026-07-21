<?php

declare(strict_types=1);

namespace Academorix\Wallet\Actions\Tenant;

use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Academorix\Wallet\Contracts\Data\WalletInterface;
use Academorix\Wallet\Contracts\Data\WalletTransactionInterface;
use Academorix\Wallet\Contracts\Repositories\WalletRepositoryInterface;
use Academorix\Wallet\Contracts\Repositories\WalletTransactionRepositoryInterface;
use Academorix\Wallet\Data\Requests\AdjustWalletRequestData;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

/**
 * `POST /api/v1/wallets/{wallet}/adjust` — admin ledger correction.
 *
 * Every adjustment writes ONE immutable `wallet_transactions` row plus
 * an atomic balance update on the parent wallet — both inside a
 * `DB::transaction()` with `SELECT ... FOR UPDATE` on the wallet row so
 * concurrent adjustments serialise.
 *
 * Positive `amount_minor` credits the wallet; negative debits.
 *
 * NOTE: this is the admin-manual correction path. Payment / refund /
 * chargeback flows write against the wallet through the finance/payment
 * + finance/refund + finance/chargeback modules, not this endpoint.
 *
 * @category Wallet
 *
 * @since    0.1.0
 */
#[AsAction(name: 'wallet.adjust.adjust')]
#[Post('/api/v1/wallets/{wallet}/adjust')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
final class AdjustAction
{
    use AsController;

    public function __construct(
        private readonly WalletRepositoryInterface $wallets,
        private readonly WalletTransactionRepositoryInterface $transactions,
    ) {
    }

    /**
     * Apply the adjustment.
     *
     * @param  Request                    $request  Carrier of tenant + auth user.
     * @param  string                     $walletId Wallet primary key.
     * @param  AdjustWalletRequestData    $data     Signed amount + reason.
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     *
     * @return Response  `201 Created` with the freshly-committed transaction row.
     */
    public function __invoke(
        Request $request,
        string $walletId,
        AdjustWalletRequestData $data,
    ): Response {
        $tenantId = (string) $request->attributes->get('tenant_id', '');
        $userId = (string) ($request->user()?->getAuthIdentifier() ?? '');

        $transactionPayload = DB::transaction(function () use (
            $walletId,
            $tenantId,
            $userId,
            $data,
        ): array {
            // Row-lock the wallet — every subsequent read + the balance
            // update run against the locked state.
            $wallet = $this->wallets->getModel()->newQuery()
                ->where(WalletInterface::ATTR_TENANT_ID, $tenantId)
                ->where(WalletInterface::ATTR_ID, $walletId)
                ->lockForUpdate()
                ->firstOrFail();

            $before = (int) $wallet->getAttribute(WalletInterface::ATTR_BALANCE_MINOR);
            $after = $before + $data->amountMinor;

            $this->wallets->update($walletId, [
                WalletInterface::ATTR_BALANCE_MINOR => $after,
                WalletInterface::ATTR_LIFETIME_CREDIT_MINOR => (int) $wallet->getAttribute(WalletInterface::ATTR_LIFETIME_CREDIT_MINOR)
                    + max(0, $data->amountMinor),
                WalletInterface::ATTR_LIFETIME_DEBIT_MINOR => (int) $wallet->getAttribute(WalletInterface::ATTR_LIFETIME_DEBIT_MINOR)
                    + max(0, -$data->amountMinor),
            ]);

            $transaction = $this->transactions->create([
                WalletTransactionInterface::ATTR_TENANT_ID           => $tenantId,
                WalletTransactionInterface::ATTR_WALLET_ID           => $walletId,
                WalletTransactionInterface::ATTR_KIND                => 'adjustment',
                WalletTransactionInterface::ATTR_AMOUNT_MINOR        => $data->amountMinor,
                WalletTransactionInterface::ATTR_BALANCE_AFTER_MINOR => $after,
                WalletTransactionInterface::ATTR_SOURCE_TYPE         => $data->sourceType,
                WalletTransactionInterface::ATTR_SOURCE_ID           => $data->sourceId,
                WalletTransactionInterface::ATTR_DESCRIPTION         => $data->reason,
                WalletTransactionInterface::ATTR_CREATED_BY          => $userId,
            ]);

            return $transaction->fresh()->toArray();
        });

        return response()->json($transactionPayload, Response::HTTP_CREATED);
    }
}
