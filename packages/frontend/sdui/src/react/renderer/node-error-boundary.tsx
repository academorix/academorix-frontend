/**
 * @file node-error-boundary.tsx
 * @module @stackra/sdui/react/renderer
 * @description Per-node error boundary — catches render/runtime errors
 *   in a single node subtree and shows a themed fallback while the rest
 *   of the tree keeps rendering.
 */

import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * Props for {@link NodeErrorBoundary}.
 */
export interface INodeErrorBoundaryProps {
  readonly nodeId: string;
  readonly nodeType: string;
  readonly children: ReactNode;
  /** Called when the boundary catches an error. */
  readonly onError?: (nodeId: string, nodeType: string, error: Error, info: ErrorInfo) => void;
}

interface INodeErrorBoundaryState {
  readonly error: Error | null;
}

/**
 * Per-node error boundary. React error boundaries must be class
 * components, so this file intentionally uses one.
 */
export class NodeErrorBoundary extends Component<INodeErrorBoundaryProps, INodeErrorBoundaryState> {
  public override state: INodeErrorBoundaryState = { error: null };

  public static getDerivedStateFromError(error: Error): INodeErrorBoundaryState {
    return { error };
  }

  public override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(this.props.nodeId, this.props.nodeType, error, info);
  }

  public override render(): ReactNode {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="border-danger/40 bg-danger-50 text-danger-700 rounded-md border p-3 text-sm"
        >
          <div className="font-medium">Node failed to render</div>
          <div className="opacity-80">
            <code>{this.props.nodeType}</code> ({this.props.nodeId}) — {this.state.error.message}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
