import { RouterProvider } from "react-aria-components";
import { Outlet, useHref, useNavigate } from "react-router";

import { LocaleProvider } from "./i18n";

export default function App() {
  const navigate = useNavigate();

  return (
    <RouterProvider navigate={navigate} useHref={useHref}>
      <LocaleProvider>
        <main className="min-h-dvh text-foreground">
          <Outlet />
        </main>
      </LocaleProvider>
    </RouterProvider>
  );
}
