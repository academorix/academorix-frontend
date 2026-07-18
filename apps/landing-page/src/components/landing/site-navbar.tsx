import { useMemo } from "react";

import { Button } from "@heroui/react";
import { Navbar } from "@heroui-pro/react";
import { Link as RouterLink } from "react-router";

import { BrandLogotipo } from "../../brand";
import { pickL, products, sports } from "../../data/site";
import { useI18n } from "../../i18n";
import { LocaleThemeControls } from "../marketing/locale-theme-controls";
import type { MegaMenuColumn } from "./mega-menu";
import { MegaMenu, MegaMenuMobileGroup } from "./mega-menu";

/** Per-product descriptor for the mega menu's "Core modules" column. */
const productDescriptionKeys: Record<string, string> = {
  scheduling: "megaMenu.core.scheduling.desc",
  attendance: "megaMenu.core.attendance.desc",
  billing: "megaMenu.core.billing.desc",
  communication: "megaMenu.core.communication.desc",
  registration: "megaMenu.core.registration.desc",
  reporting: "megaMenu.core.reporting.desc",
};

export function SiteNavbar() {
  const { t, locale } = useI18n();

  const flatItems = useMemo(
    () => [
      { href: "/products", label: t("nav.products") },
      { href: "/sports", label: t("nav.sports") },
      { href: "/solutions", label: t("nav.solutions") },
      { href: "/enterprise", label: t("nav.enterprise") },
      { href: "/pricing", label: t("nav.pricing") },
      { href: "/docs", label: t("nav.resources") },
    ],
    [t],
  );

  const productsMegaColumns: MegaMenuColumn[] = useMemo(() => {
    const coreItems = products.map((product) => ({
      icon: product.icon,
      label: pickL(product.name, locale),
      description: productDescriptionKeys[product.slug]
        ? t(productDescriptionKeys[product.slug])
        : pickL(product.tagline, locale),
      href: "/products/" + product.slug,
    }));

    return [
      { label: t("megaMenu.core.title"), items: coreItems },
      {
        label: t("megaMenu.intelligence.title"),
        items: [
          {
            icon: "sparkles",
            label: t("megaMenu.intelligence.aiEngine"),
            description: t("megaMenu.intelligence.aiEngineDesc"),
            href: "/products/ai-engine",
          },
          {
            icon: "chart-column",
            label: t("megaMenu.intelligence.analytics"),
            description: t("megaMenu.intelligence.analyticsDesc"),
            href: "/products/reporting",
          },
          {
            icon: "thunderbolt",
            label: t("megaMenu.intelligence.automations"),
            description: t("megaMenu.intelligence.automationsDesc"),
            href: "/products/scheduling",
          },
        ],
      },
    ];
  }, [locale, t]);

  const sportsMegaColumns: MegaMenuColumn[] = useMemo(
    () => [
      {
        label: t("megaMenu.sports.title"),
        items: sports.map((sport) => ({
          icon: sport.icon,
          label: pickL(sport.name, locale),
          description: pickL(sport.venue, locale),
          href: "/sports/" + sport.slug,
        })),
      },
    ],
    [locale, t],
  );

  const productsMobileItems = products.map((product) => ({
    label: pickL(product.name, locale),
    href: "/products/" + product.slug,
  }));

  const sportsMobileItems = sports.map((sport) => ({
    label: pickL(sport.name, locale),
    href: "/sports/" + sport.slug,
  }));

  const secondaryItems = flatItems.slice(2); // Solutions, Enterprise, Pricing, Resources

  return (
    <Navbar height="4.5rem" maxWidth="xl" position="sticky">
      <Navbar.Header>
        <Navbar.Brand render={(props) => <RouterLink to="/" {...(props as object)} />}>
          <BrandLogotipo className="h-7 w-auto text-foreground" />
        </Navbar.Brand>

        <Navbar.Spacer />

        <Navbar.Content className="hidden items-center gap-6 lg:flex">
          <MegaMenu
            banner={{
              icon: "sparkles",
              title: t("megaMenu.products.banner.title"),
              description: t("megaMenu.products.banner.description"),
              ctaLabel: t("megaMenu.products.banner.cta"),
              ctaHref: "/products/ai-engine",
              accent: "bg-violet-500/10",
            }}
            columns={productsMegaColumns}
            trigger={t("nav.products")}
          />
          <MegaMenu
            banner={{
              icon: "sparkles",
              title: t("megaMenu.sports.banner.title"),
              description: t("megaMenu.sports.banner.description"),
              ctaLabel: t("megaMenu.sports.banner.cta"),
              ctaHref: "/contact-sales",
              accent: "bg-sky-500/10",
            }}
            columns={sportsMegaColumns}
            trigger={t("nav.sports")}
          />
          {secondaryItems.map((item) => (
            <Navbar.Item key={item.href} href={item.href}>
              {item.label}
            </Navbar.Item>
          ))}
        </Navbar.Content>

        <Navbar.Spacer />

        <Navbar.Content>
          <div className="hidden sm:flex">
            <LocaleThemeControls />
          </div>
          <Button
            className="hidden lg:inline-flex"
            render={(props) => <RouterLink to="/find-workspaces" {...(props as object)} />}
            size="sm"
            variant="ghost"
          >
            {t("nav.signIn")}
          </Button>
          <Button
            className="hidden sm:inline-flex"
            render={(props) => <RouterLink to="/create-workspace" {...(props as object)} />}
            size="sm"
            variant="primary"
          >
            {t("nav.startTrial")}
          </Button>
          <Navbar.MenuToggle className="lg:hidden" />
        </Navbar.Content>
      </Navbar.Header>

      <Navbar.Menu>
        <div className="flex flex-col gap-6">
          <MegaMenuMobileGroup items={productsMobileItems} trigger={t("nav.products")} />
          <MegaMenuMobileGroup items={sportsMobileItems} trigger={t("nav.sports")} />
          {secondaryItems.map((item) => (
            <Navbar.MenuItem key={item.href} href={item.href}>
              {item.label}
            </Navbar.MenuItem>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <LocaleThemeControls />
          <Button
            render={(props) => <RouterLink to="/create-workspace" {...(props as object)} />}
            variant="primary"
          >
            {t("nav.startTrial")}
          </Button>
        </div>
      </Navbar.Menu>
    </Navbar>
  );
}
