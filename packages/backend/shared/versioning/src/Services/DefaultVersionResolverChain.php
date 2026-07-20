<?php

declare(strict_types=1);

namespace Academorix\Versioning\Services;

use Academorix\Versioning\Contracts\Services\VersionResolverChainInterface;
use Academorix\Versioning\Contracts\Services\VersionResolverInterface;
use Academorix\Versioning\Resolvers\ContentNegotiationResolver;
use Academorix\Versioning\Resolvers\GraphQlContextResolver;
use Academorix\Versioning\Resolvers\QueryParamResolver;
use Academorix\Versioning\Resolvers\UrlPathResolver;
use Academorix\Versioning\Resolvers\WebhookSubscriptionResolver;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Http\Request;

/**
 * Default {@see VersionResolverChainInterface} implementation.
 *
 * Composes the five shipped resolvers in the order declared by
 * `versioning.resolvers.order`. `#[Scoped]` because resolution
 * touches request state (via the resolvers) and the chain memoises
 * per-request.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultVersionResolverChain implements VersionResolverChainInterface
{
    /**
     * Resolvers in the order they will run.
     *
     * @var list<VersionResolverInterface>
     */
    private array $resolvers;

    public function __construct(
        UrlPathResolver $url,
        ContentNegotiationResolver $header,
        QueryParamResolver $query,
        WebhookSubscriptionResolver $webhook,
        GraphQlContextResolver $graphql,
    ) {
        $available = [
            'url'     => $url,
            'header'  => $header,
            'query'   => $query,
            'webhook' => $webhook,
            'graphql' => $graphql,
        ];

        $order = (array) \config('versioning.resolvers.order', ['url', 'header', 'webhook', 'graphql', 'query']);

        $chain = [];
        foreach ($order as $name) {
            if (\is_string($name) && isset($available[$name])) {
                $chain[] = $available[$name];
            }
        }

        $this->resolvers = $chain;
    }

    /**
     * {@inheritDoc}
     */
    public function resolve(Request $request): ?string
    {
        foreach ($this->resolvers as $resolver) {
            $slug = $resolver->resolve($request);
            if ($slug !== null && $slug !== '') {
                return $slug;
            }
        }

        return null;
    }

    /**
     * {@inheritDoc}
     */
    public function register(VersionResolverInterface $resolver): void
    {
        $this->resolvers[] = $resolver;
    }
}
