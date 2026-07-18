import { useEffect } from "react";

import { Outlet, Link as RouterLink, useLocation } from "react-router";

import { BrandLogotipo } from "../../brand";

export function AuthLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center px-5 py-6 sm:px-6">
        <RouterLink className="link inline-flex" to="/">
          <BrandLogotipo className="h-7 w-auto text-foreground" />
        </RouterLink>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
