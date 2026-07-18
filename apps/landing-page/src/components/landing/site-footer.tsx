import {
  Button,
  Form,
  InputGroup,
  Label,
  Link,
  ListBox,
  Select,
  Separator,
  TextField,
} from "@heroui/react";
import { Link as RouterLink } from "react-router";

import { BrandLogotipo, brand } from "../../brand";
import { locales, localeMeta, useI18n } from "../../i18n";
import type { Locale } from "../../i18n";
import { Iconify } from "../../icons/iconify";

type FooterLink = { labelKey: string; to: string };

export function SiteFooter() {
  const { t, locale, setLocale } = useI18n();

  const columns: { titleKey: string; links: FooterLink[] }[] = [
    {
      titleKey: "footer.col.product",
      links: [
        { labelKey: "footer.product.scheduling", to: "/products/scheduling" },
        { labelKey: "footer.product.attendance", to: "/products/attendance" },
        { labelKey: "footer.product.billing", to: "/products/billing" },
        { labelKey: "footer.product.communication", to: "/products/communication" },
        { labelKey: "footer.product.registration", to: "/products/registration" },
        { labelKey: "footer.product.reporting", to: "/products/reporting" },
      ],
    },
    {
      titleKey: "footer.col.sports",
      links: [
        { labelKey: "sport.swimming", to: "/sports/swimming" },
        { labelKey: "sport.gymnastics", to: "/sports/gymnastics" },
        { labelKey: "sport.soccer", to: "/sports/soccer" },
        { labelKey: "sport.tennis", to: "/sports/tennis" },
        { labelKey: "sport.athletics", to: "/sports/athletics" },
        { labelKey: "sport.martial-arts", to: "/sports/martial-arts" },
      ],
    },
    {
      titleKey: "footer.col.solutions",
      links: [
        { labelKey: "footer.solutions.single", to: "/solutions/single-academy" },
        { labelKey: "footer.solutions.multi", to: "/solutions/multi-site" },
        { labelKey: "footer.solutions.franchise", to: "/solutions/franchises" },
        { labelKey: "footer.solutions.clubs", to: "/solutions/clubs" },
        { labelKey: "footer.solutions.enterprise", to: "/enterprise" },
        { labelKey: "footer.solutions.pricing", to: "/pricing" },
      ],
    },
    {
      titleKey: "footer.col.forTeams",
      links: [
        { labelKey: "footer.forTeams.directors", to: "/for/directors" },
        { labelKey: "footer.forTeams.coaches", to: "/for/coaches" },
        { labelKey: "footer.forTeams.administrators", to: "/for/administrators" },
        { labelKey: "footer.forTeams.parents", to: "/for/parents" },
        { labelKey: "footer.forTeams.customers", to: "/customers" },
      ],
    },
    {
      titleKey: "footer.col.resources",
      links: [
        { labelKey: "footer.resources.docs", to: "/docs" },
        { labelKey: "footer.resources.tutorials", to: "/resources/tutorials" },
        { labelKey: "footer.resources.changelog", to: "/changelog" },
        { labelKey: "footer.resources.blog", to: "/blog" },
        { labelKey: "footer.resources.faq", to: "/faq" },
        { labelKey: "footer.resources.newsletter", to: "/newsletter" },
      ],
    },
    {
      titleKey: "footer.col.company",
      links: [
        { labelKey: "footer.company.about", to: "/about" },
        { labelKey: "footer.company.careers", to: "/careers" },
        { labelKey: "footer.company.press", to: "/press" },
        { labelKey: "footer.company.contactSales", to: "/contact-sales" },
        { labelKey: "footer.company.legal", to: "/legal" },
      ],
    },
  ];

  const socials = [
    { label: "X", icon: "simple-icons:x", href: "https://x.com" },
    { label: "LinkedIn", icon: "simple-icons:linkedin", href: "https://linkedin.com" },
    { label: "YouTube", icon: "simple-icons:youtube", href: "https://youtube.com" },
    { label: "Instagram", icon: "simple-icons:instagram", href: "https://instagram.com" },
    { label: "GitHub", icon: "simple-icons:github", href: "https://github.com" },
  ];

  const badges = [
    { icon: "shield-check", labelKey: "footer.badge.soc2" },
    { icon: "lock", labelKey: "footer.badge.gdpr" },
    { icon: "circle-check", labelKey: "footer.badge.iso" },
  ];

  const legalLinks: FooterLink[] = [
    { labelKey: "footer.legal.privacy", to: "/legal/privacy" },
    { labelKey: "footer.legal.terms", to: "/legal/terms" },
    { labelKey: "footer.legal.security", to: "/legal/security" },
    { labelKey: "footer.legal.dpa", to: "/legal/dpa" },
  ];

  return (
    <footer className="border-t border-separator bg-surface-secondary/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <div className="max-w-md">
            <BrandLogotipo className="h-7 w-auto text-foreground" />
            <p className="mt-4 text-sm leading-relaxed text-muted">{t("footer.tagline")}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {badges.map((badge) => (
                <span
                  key={badge.labelKey}
                  className="inline-flex items-center gap-1.5 rounded-full border border-separator px-2.5 py-1 text-xs font-medium text-muted"
                >
                  <Iconify className="size-3.5 text-accent-foreground" icon={badge.icon} />
                  {t(badge.labelKey)}
                </span>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2">
              {socials.map((social) => (
                <Link
                  key={social.label}
                  aria-label={social.label}
                  className="flex size-9 items-center justify-center rounded-full border border-separator text-muted transition-colors hover:border-accent hover:text-foreground"
                  href={social.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Iconify className="size-4" icon={social.icon} />
                </Link>
              ))}
            </div>
          </div>

          <div className="lg:ps-8">
            <p className="font-display text-base font-semibold text-foreground">
              {t("footer.newsletterTitle")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {t("footer.newsletterSubtitle")}
            </p>
            <Form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <TextField className="w-full" name="email" type="email" variant="secondary">
                <Label className="sr-only">{t("common.email")}</Label>
                <InputGroup className="w-full" variant="secondary">
                  <InputGroup.Prefix>
                    <Iconify className="size-4 text-muted" icon="envelope" />
                  </InputGroup.Prefix>
                  <InputGroup.Input className="w-full" placeholder={t("footer.emailPlaceholder")} />
                </InputGroup>
              </TextField>
              <Button className="shrink-0" type="submit" variant="primary">
                {t("footer.subscribe")}
                <Iconify className="size-4" icon="arrow-right" />
              </Button>
            </Form>
          </div>
        </div>

        <Separator className="my-12 h-px bg-separator" />

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
          {columns.map((column) => (
            <div key={column.titleKey}>
              <p className="font-display text-sm font-semibold text-foreground">
                {t(column.titleKey)}
              </p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.labelKey}>
                    <RouterLink
                      className="link text-sm font-normal text-muted transition-colors hover:text-foreground"
                      to={link.to}
                    >
                      {t(link.labelKey)}
                    </RouterLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-10 h-px bg-separator" />

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <p className="text-sm text-muted">
              © {new Date().getFullYear()} {brand.name}, Inc. {t("footer.rights")}
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
              <span className="size-2 rounded-full bg-success" />
              {t("footer.allSystems")}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex items-center gap-4">
              {legalLinks.map((link) => (
                <RouterLink
                  key={link.labelKey}
                  className="link text-sm font-normal text-muted transition-colors hover:text-foreground"
                  to={link.to}
                >
                  {t(link.labelKey)}
                </RouterLink>
              ))}
            </div>

            <Select
              aria-label={t("controls.language")}
              className="w-[168px]"
              onSelectionChange={(key) => key && setLocale(key as Locale)}
              selectedKey={locale}
              variant="secondary"
            >
              <Select.Trigger>
                <Iconify className="size-4 text-muted" icon="globe" />
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {locales.map((code) => (
                    <ListBox.Item key={code} id={code} textValue={localeMeta[code].native}>
                      {localeMeta[code].native}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
        </div>
      </div>
    </footer>
  );
}
