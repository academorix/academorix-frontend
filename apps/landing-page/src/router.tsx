import { createBrowserRouter } from "react-router";

import App from "./App";
import { PreviewErrorBoundary } from "./components/preview-error-boundary";
import { AuthLayout } from "./components/marketing/auth-layout";
import { MarketingLayout } from "./components/marketing/marketing-layout";
import { IndexRoute } from "./routes";
import { CreateWorkspaceRoute, FindWorkspacesRoute } from "./routes/auth";
import { BlogPostRoute, BlogRoute } from "./routes/blog";
import { AboutRoute, CareerDetailRoute, CareersRoute, PressRoute } from "./routes/company";
import { ContactSalesRoute } from "./routes/contact-sales";
import { CustomerDetailRoute, CustomersRoute } from "./routes/customers";
import { EnterpriseRoute } from "./routes/enterprise";
import { AiEngineRoute } from "./routes/ai-engine";
import { FaqRoute } from "./routes/faq";
import { LegalDetailRoute, LegalRoute } from "./routes/legal";
import { PersonaDetailRoute, PersonasRoute } from "./routes/personas";
import { PricingRoute } from "./routes/pricing";
import { ProductDetailRoute, ProductsRoute } from "./routes/products";
import {
  ChangelogRoute,
  DocDetailRoute,
  DocsRoute,
  NewsletterRoute,
  TutorialDetailRoute,
  TutorialsRoute,
} from "./routes/resources";
import { SolutionDetailRoute, SolutionsRoute } from "./routes/solutions";
import { SportDetailRoute, SportsRoute } from "./routes/sports";
import { NotFoundRoute } from "./routes/not-found";

export const router = createBrowserRouter([
  {
    Component: App,
    ErrorBoundary: PreviewErrorBoundary,
    path: "/",
    children: [
      {
        Component: MarketingLayout,
        children: [
          { Component: IndexRoute, index: true },
          { Component: ProductsRoute, path: "products" },
          { Component: AiEngineRoute, path: "products/ai-engine" },
          { Component: ProductDetailRoute, path: "products/:slug" },
          { Component: SportsRoute, path: "sports" },
          { Component: SportDetailRoute, path: "sports/:slug" },
          { Component: SolutionsRoute, path: "solutions" },
          { Component: SolutionDetailRoute, path: "solutions/:slug" },
          { Component: PersonasRoute, path: "for" },
          { Component: PersonaDetailRoute, path: "for/:slug" },
          { Component: EnterpriseRoute, path: "enterprise" },
          { Component: PricingRoute, path: "pricing" },
          { Component: CustomersRoute, path: "customers" },
          { Component: CustomerDetailRoute, path: "customers/:slug" },
          { Component: BlogRoute, path: "blog" },
          { Component: BlogPostRoute, path: "blog/:slug" },
          { Component: FaqRoute, path: "faq" },
          { Component: LegalRoute, path: "legal" },
          { Component: LegalDetailRoute, path: "legal/:slug" },
          { Component: AboutRoute, path: "about" },
          { Component: CareersRoute, path: "careers" },
          { Component: CareerDetailRoute, path: "careers/:slug" },
          { Component: PressRoute, path: "press" },
          { Component: ContactSalesRoute, path: "contact-sales" },
          { Component: DocsRoute, path: "docs" },
          { Component: DocDetailRoute, path: "docs/:slug" },
          { Component: ChangelogRoute, path: "changelog" },
          { Component: NewsletterRoute, path: "newsletter" },
          { Component: TutorialsRoute, path: "resources/tutorials" },
          { Component: TutorialDetailRoute, path: "resources/tutorials/:slug" },
          { Component: NotFoundRoute, path: "*" },
        ],
      },
      {
        Component: AuthLayout,
        children: [
          { Component: CreateWorkspaceRoute, path: "create-workspace" },
          { Component: FindWorkspacesRoute, path: "find-workspaces" },
        ],
      },
    ],
  },
]);
