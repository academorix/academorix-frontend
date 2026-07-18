import { useEffect } from "react";

import { Outlet, useLocation } from "react-router";

import { Seo, organizationJsonLd } from "../seo";
import { SiteFooter } from "../landing/site-footer";
import { SiteNavbar } from "../landing/site-navbar";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return null;
}

export function MarketingLayout() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-dvh flex-col">
      <Seo jsonLd={organizationJsonLd} path={pathname} />
      <ScrollToTop />
      <SiteNavbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <SiteFooter />
    </div>
  );
}
