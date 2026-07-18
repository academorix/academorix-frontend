import { Button } from "@heroui/react";
import { Link as RouterLink } from "react-router";

import { useI18n } from "../i18n";
import { Iconify } from "../icons/iconify";

export function NotFoundRoute() {
  const { t } = useI18n();

  return (
    <section className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="max-w-md space-y-3">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {t("notFound.title")}
        </h1>
        <p className="text-base leading-relaxed text-muted">{t("notFound.subtitle")}</p>
      </div>
      <Button render={(props) => <RouterLink to="/" {...(props as object)} />} variant="primary">
        {t("notFound.cta")}
        <Iconify className="size-4 rtl:rotate-180" icon="arrow-right" />
      </Button>
    </section>
  );
}
