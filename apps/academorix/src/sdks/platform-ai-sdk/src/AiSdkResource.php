<?php

declare(strict_types=1);

namespace Stackra\PlatformAiSdk;

use Stackra\ApiSdk\Attributes\AsSdkResource;
use Stackra\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `ai` module.
 *
 * Registered under `#[AsSdkResource(name: 'ai', service: 'platform')]`
 * so the Platform service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->ai()->...`.
 *
 * ## Peer Resources
 *
 * - AiConversationsResource — peer resource for `ai-conversations`.
 * - AiDraftsResource — peer resource for `ai-drafts`.
 * - AiEmbeddingsResource — peer resource for `ai-embeddings`.
 * - AiRunsResource — peer resource for `ai-runs`.
 * - AiToolCallsResource — peer resource for `ai-tool-calls`.
 *
 * @category AiSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'ai', service: 'platform')]
final class AiSdkResource extends BaseSdkResource
{
    private ?Resources\AiConversationsResource $aiConversations = null;
    private ?Resources\AiDraftsResource $aiDrafts = null;
    private ?Resources\AiEmbeddingsResource $aiEmbeddings = null;
    private ?Resources\AiRunsResource $aiRuns = null;
    private ?Resources\AiToolCallsResource $aiToolCalls = null;

    /**
     * Access AiConversations peer Resource.
     */
    public function aiConversations(): Resources\AiConversationsResource
    {
        return $this->aiConversations ??= new Resources\AiConversationsResource($this->connector);
    }

    /**
     * Access AiDrafts peer Resource.
     */
    public function aiDrafts(): Resources\AiDraftsResource
    {
        return $this->aiDrafts ??= new Resources\AiDraftsResource($this->connector);
    }

    /**
     * Access AiEmbeddings peer Resource.
     */
    public function aiEmbeddings(): Resources\AiEmbeddingsResource
    {
        return $this->aiEmbeddings ??= new Resources\AiEmbeddingsResource($this->connector);
    }

    /**
     * Access AiRuns peer Resource.
     */
    public function aiRuns(): Resources\AiRunsResource
    {
        return $this->aiRuns ??= new Resources\AiRunsResource($this->connector);
    }

    /**
     * Access AiToolCalls peer Resource.
     */
    public function aiToolCalls(): Resources\AiToolCallsResource
    {
        return $this->aiToolCalls ??= new Resources\AiToolCallsResource($this->connector);
    }
}
