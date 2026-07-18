/**
 * @file apps/landing-page/src/main.tsx
 * @module main
 *
 * @description
 * Boot entry for the landing-page SPA. Same pattern as the
 * dashboard's `main.tsx` but with a slimmer bootstrap (no theme
 * cache, no Firebase). See dashboard's main.tsx for the design
 * rationale.
 */

import "reflect-metadata";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";

import { applyBrandDocumentMetadata } from "./brand";
import { router } from "./router";

import "./index.css";

/**
 * Boot sequence.
 */
async function bootstrap(): Promise<void> {
  // Tab title + favicon follow src/brand/metadata.json.
  applyBrandDocumentMetadata();

  // Mount React.
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Root element "#root" was not found in the document.');
  }

  createRoot(rootElement).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}

void bootstrap();
