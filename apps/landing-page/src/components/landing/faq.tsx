import { Accordion } from "@heroui/react";

import { useI18n } from "../../i18n";
import { Iconify } from "../../icons/iconify";

/**
 * Keys are declared here (not looped by index) so a translator can locate the
 * matching answer in `dictionaries.ts` by grepping for `faq.q3` / `faq.a3`.
 */
const FAQ_KEYS = ["1", "2", "3", "4", "5", "6"] as const;

export function Faq() {
  const { t } = useI18n();

  return (
    <section className="border-t border-border bg-surface-secondary" id="faq">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:py-28">
        <div>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {t("faq.title")}
          </h2>
          <p className="mt-4 text-lg text-muted">{t("faq.subtitle")}</p>
        </div>

        <Accordion className="w-full" defaultExpandedKeys={[0]} variant="surface">
          {FAQ_KEYS.map((n, index) => (
            <Accordion.Item key={n} id={index}>
              <Accordion.Heading>
                <Accordion.Trigger className="font-display text-left text-base font-semibold">
                  {t(`faq.q${n}`)}
                  <Accordion.Indicator>
                    <Iconify className="size-4" icon="chevron-down" />
                  </Accordion.Indicator>
                </Accordion.Trigger>
              </Accordion.Heading>
              <Accordion.Panel>
                <Accordion.Body className="text-sm leading-relaxed text-muted">
                  {t(`faq.a${n}`)}
                </Accordion.Body>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
