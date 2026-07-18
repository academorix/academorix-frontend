import {
  Button,
  Card,
  Form,
  Input,
  Label,
  ListBox,
  Select,
  TextArea,
  TextField,
} from "@heroui/react";

import { useI18n } from "../i18n";
import { Section } from "../components/marketing/sections";
import { PageHeader } from "../components/marketing/page-header";
import { Iconify } from "../icons/iconify";

type Highlight = { icon: string; titleKey: string; descKey: string };

const highlights: Highlight[] = [
  {
    icon: "calendar",
    titleKey: "contactSales.highlights.walkthrough.title",
    descKey: "contactSales.highlights.walkthrough.description",
  },
  {
    icon: "gear",
    titleKey: "contactSales.highlights.migration.title",
    descKey: "contactSales.highlights.migration.description",
  },
  {
    icon: "person",
    titleKey: "contactSales.highlights.contact.title",
    descKey: "contactSales.highlights.contact.description",
  },
];

const sizeKeys = [
  "contactSales.form.size.small",
  "contactSales.form.size.medium",
  "contactSales.form.size.large",
  "contactSales.form.size.enterprise",
];

const sportKeys = [
  "contactSales.form.sport.swimming",
  "contactSales.form.sport.gymnastics",
  "contactSales.form.sport.soccer",
  "contactSales.form.sport.tennis",
  "contactSales.form.sport.athletics",
  "contactSales.form.sport.martialArts",
  "contactSales.form.sport.multi",
  "contactSales.form.sport.other",
];

export function ContactSalesRoute() {
  const { t } = useI18n();

  return (
    <>
      <PageHeader
        eyebrow={t("contactSales.eyebrow")}
        title={t("contactSales.hero.title")}
        description={t("contactSales.hero.description")}
      />
      <Section bordered={false}>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            {highlights.map((item) => (
              <div key={item.titleKey} className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Iconify className="size-5" icon={item.icon} />
                </div>
                <div>
                  <p className="font-display text-base font-semibold text-foreground">
                    {t(item.titleKey)}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{t(item.descKey)}</p>
                </div>
              </div>
            ))}
          </div>

          <Card className="border border-border">
            <Card.Content>
              <Form className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField isRequired name="firstName" variant="secondary">
                    <Label>{t("contactSales.form.firstName")}</Label>
                    <Input placeholder={t("contactSales.form.firstNamePlaceholder")} />
                  </TextField>
                  <TextField isRequired name="lastName" variant="secondary">
                    <Label>{t("contactSales.form.lastName")}</Label>
                    <Input placeholder={t("contactSales.form.lastNamePlaceholder")} />
                  </TextField>
                </div>

                <TextField isRequired name="email" type="email" variant="secondary">
                  <Label>{t("contactSales.form.email")}</Label>
                  <Input placeholder={t("contactSales.form.emailPlaceholder")} />
                </TextField>

                <TextField isRequired name="academy" variant="secondary">
                  <Label>{t("contactSales.form.academy")}</Label>
                  <Input placeholder={t("contactSales.form.academyPlaceholder")} />
                </TextField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    className="w-full"
                    placeholder={t("contactSales.form.selectSport")}
                    variant="secondary"
                  >
                    <Label>{t("contactSales.form.primarySport")}</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {sportKeys.map((key) => {
                          const label = t(key);

                          return (
                            <ListBox.Item key={key} id={key} textValue={label}>
                              {label}
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          );
                        })}
                      </ListBox>
                    </Select.Popover>
                  </Select>

                  <Select
                    className="w-full"
                    placeholder={t("contactSales.form.selectSize")}
                    variant="secondary"
                  >
                    <Label>{t("contactSales.form.academySize")}</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {sizeKeys.map((key) => {
                          const label = t(key);

                          return (
                            <ListBox.Item key={key} id={key} textValue={label}>
                              {label}
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          );
                        })}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>

                <TextField name="message" variant="secondary">
                  <Label>{t("contactSales.form.helpLabel")}</Label>
                  <TextArea placeholder={t("contactSales.form.helpPlaceholder")} rows={4} />
                </TextField>

                <Button className="mt-2" fullWidth type="submit" variant="primary">
                  {t("contactSales.form.request")}
                  <Iconify className="size-4 rtl:rotate-180" icon="arrow-right" />
                </Button>
              </Form>
            </Card.Content>
          </Card>
        </div>
      </Section>
    </>
  );
}
