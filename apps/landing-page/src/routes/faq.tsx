import { Accordion } from "@heroui/react";

import { faqs, pickL } from "../data/site";
import { useI18n } from "../i18n";
import { CtaSection, Section } from "../components/marketing/sections";
import { PageHeader } from "../components/marketing/page-header";
import { Iconify } from "../icons/iconify";

export function FaqRoute() {
  const { t, locale } = useI18n();

  return (
    <>
      <PageHeader
        align="center"
        eyebrow={t("faqPage.eyebrow")}
        title={t("faqPage.title")}
        description={t("faqPage.subtitle")}
      />
      <Section bordered={false}>
        <Accordion className="mx-auto w-full max-w-3xl" defaultExpandedKeys={[0]} variant="surface">
          {faqs.map((item, index) => (
            <Accordion.Item key={item.q.en} id={index}>
              <Accordion.Heading>
                <Accordion.Trigger className="font-display text-left text-base font-semibold">
                  {pickL(item.q, locale)}
                  <Accordion.Indicator>
                    <Iconify className="size-4" icon="chevron-down" />
                  </Accordion.Indicator>
                </Accordion.Trigger>
              </Accordion.Heading>
              <Accordion.Panel>
                <Accordion.Body className="text-sm leading-relaxed text-muted">
                  {pickL(item.a, locale)}
                </Accordion.Body>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Section>
      <CtaSection
        title={t("faqPage.stillHave")}
        description={t("faqPage.stillHaveDesc")}
        primaryLabel={t("common.contactSales")}
        primaryHref="/contact-sales"
      />
    </>
  );
}
