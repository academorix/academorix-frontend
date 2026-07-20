<?php

declare(strict_types=1);

namespace Academorix\Wallet\Actions\Tenant;

use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Wallet\Contracts\Data\WalletTransactionInterface;
use Academorix\Wallet\Contracts\Repositories\WalletTransactionRepositoryInterface;
use Illuminate\Http\Request;

/**
 * `GET /api/v1/wallets/{wallet}/transactions` — wallet-scoped ledger.
 *
 * Immutable per-wallet debit / credit history in reverse-chronological
 * order. Every row is a committed transaction; there is no soft-delete
 * — reversals write a new inverse row instead.
 *
 * @category Wallet
 *
 * @since    0.1.0
 */
#[AsAction(name: 'wallet.transactions.transactions')]
#[Get('/api/v1/wallets/{wallet}/transactions')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
final class TransactionsTransactionAction
{
    use AsController;

    public function __construct(
        private readonly WalletTransactionRepositoryInterface $repository,
    ) {
    }

    /**
     * List transactions for one wallet.
     *
     * @param  Request  $request  Filters + pagination controls.
     * @param  string   $walletId Parent wallet id.
     *
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     *   Paginated Eloquent models; the routing envelope handles the
     *   wire representation.
     */
    public function __invoke(Request $request, string $walletId)
    {
        return $this->repository->getModel()->newQuery()
            ->where(WalletTransactionInterface::ATTR_WALLET_ID, $walletId)
            ->orderByDesc(WalletTransactionInterface::ATTR_CREATED_AT)
            ->paginate((int) $request->integer('per_page', 25));
    }
}
