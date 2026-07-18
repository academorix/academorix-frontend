import { Avatar, Chip, ProgressBar, Switch, Table, Tabs } from "@heroui/react";

import { useI18n } from "../../i18n";
import { Iconify } from "../../icons/iconify";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat"] as const;

type Session = {
  time: string;
  sessionKey: string;
  coach: string;
  initials: string;
  courtKey: string;
  statusKey: string;
  tone: "success" | "warning" | "default";
};

// Coach names are personal names — kept as literal strings in either locale
// (they aren't translated; only their surrounding labels flip).
const sessions: Session[] = [
  {
    time: "07:30",
    sessionKey: "freestyle",
    coach: "Nadia Petrova",
    initials: "NP",
    courtKey: "pool2",
    statusKey: "confirmed",
    tone: "success",
  },
  {
    time: "09:00",
    sessionKey: "beam",
    coach: "Marcus Lee",
    initials: "ML",
    courtKey: "gymHall",
    statusKey: "confirmed",
    tone: "success",
  },
  {
    time: "10:15",
    sessionKey: "u12",
    coach: "Sofia Duarte",
    initials: "SD",
    courtKey: "pitch1",
    statusKey: "waitlist",
    tone: "warning",
  },
  {
    time: "16:45",
    sessionKey: "sprint",
    coach: "Tariq Hassan",
    initials: "TH",
    courtKey: "track",
    statusKey: "confirmed",
    tone: "success",
  },
];

type Invoice = {
  familyKey: string;
  planKey: string;
  amount: string;
  statusKey: string;
  tone: "success" | "warning" | "danger";
};

const invoices: Invoice[] = [
  {
    familyKey: "okonkwo",
    planKey: "swimMonthly",
    amount: "$180",
    statusKey: "paid",
    tone: "success",
  },
  { familyKey: "bianchi", planKey: "gymTerm", amount: "$540", statusKey: "paid", tone: "success" },
  {
    familyKey: "novak",
    planKey: "soccerMonthly",
    amount: "$120",
    statusKey: "due",
    tone: "warning",
  },
  {
    familyKey: "ahmed",
    planKey: "multiSport",
    amount: "$260",
    statusKey: "overdue",
    tone: "danger",
  },
];

function ChromeBar() {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-2 border-b border-border bg-surface-secondary/70 px-4 py-3">
      <span className="size-2.5 rounded-full bg-border" />
      <span className="size-2.5 rounded-full bg-border" />
      <span className="size-2.5 rounded-full bg-border" />
      <div className="ml-3 flex items-center gap-1.5 text-xs font-medium text-muted">
        <Iconify className="size-3.5" icon="lock" />
        {t("preview.address")}
      </div>
    </div>
  );
}

function SchedulePanel() {
  const { t } = useI18n();

  return (
    <div className="p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-display text-sm font-semibold text-foreground">{t("preview.today")}</p>
          <p className="text-xs text-muted">{t("preview.liveVenues")}</p>
        </div>
        <Chip color="success" size="sm" variant="soft">
          <Iconify className="size-3" icon="circle-check" />
          {t("preview.onTrack")}
        </Chip>
      </div>

      <div className="mb-4 flex gap-1.5">
        {DAY_KEYS.map((day, index) => (
          <div
            key={day}
            className={
              "flex-1 rounded-md px-2 py-1.5 text-center text-xs font-medium " +
              (index === 2 ? "bg-accent text-accent-foreground" : "bg-surface-secondary text-muted")
            }
          >
            {t(`preview.day.${day}`)}
          </div>
        ))}
      </div>

      <Table aria-label={t("preview.tabSchedule")} variant="secondary">
        <Table.ScrollContainer>
          <Table.Content aria-label={t("preview.tabSchedule")} className="min-w-[380px]">
            <Table.Header>
              <Table.Column isRowHeader>{t("preview.col.time")}</Table.Column>
              <Table.Column>{t("preview.col.session")}</Table.Column>
              <Table.Column>{t("preview.col.coach")}</Table.Column>
              <Table.Column>{t("preview.col.status")}</Table.Column>
            </Table.Header>
            <Table.Body>
              {sessions.map((item) => (
                <Table.Row key={item.time}>
                  <Table.Cell className="font-medium tabular-nums">{item.time}</Table.Cell>
                  <Table.Cell>
                    <span className="font-medium text-foreground">
                      {t(`preview.session.${item.sessionKey}`)}
                    </span>
                    <span className="block text-xs text-muted">
                      {t(`preview.venue.${item.courtKey}`)}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <Avatar color="accent" size="sm" variant="soft">
                        <Avatar.Fallback>{item.initials}</Avatar.Fallback>
                      </Avatar>
                      <span className="truncate text-xs">{item.coach}</span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Chip color={item.tone} size="sm" variant="soft">
                      {t(`preview.status.${item.statusKey}`)}
                    </Chip>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  );
}

function BillingPanel() {
  const { t } = useI18n();

  return (
    <div className="p-4 sm:p-5">
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-muted">{t("preview.billing.collected")}</p>
          <p className="font-display mt-1 text-2xl font-bold text-foreground tabular-nums">
            $48,240
          </p>
          <p className="mt-0.5 text-xs text-muted">{t("preview.billing.collectedNote")}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-muted">{t("preview.billing.outstanding")}</p>
          <p className="font-display mt-1 text-2xl font-bold text-foreground tabular-nums">
            $3,910
          </p>
          <ProgressBar
            aria-label={t("preview.billing.collected")}
            className="mt-2 gap-1"
            color="success"
            value={92}
          >
            <ProgressBar.Track className="h-1.5">
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
        </div>
      </div>

      <Table aria-label={t("preview.tabBilling")} variant="secondary">
        <Table.ScrollContainer>
          <Table.Content aria-label={t("preview.tabBilling")} className="min-w-[380px]">
            <Table.Header>
              <Table.Column isRowHeader>{t("preview.col.family")}</Table.Column>
              <Table.Column>{t("preview.col.plan")}</Table.Column>
              <Table.Column>{t("preview.col.amount")}</Table.Column>
              <Table.Column>{t("preview.col.status")}</Table.Column>
            </Table.Header>
            <Table.Body>
              {invoices.map((item) => (
                <Table.Row key={item.familyKey}>
                  <Table.Cell className="font-medium">
                    {t(`preview.family.${item.familyKey}`)}
                  </Table.Cell>
                  <Table.Cell className="text-xs text-muted">
                    {t(`preview.plan.${item.planKey}`)}
                  </Table.Cell>
                  <Table.Cell className="font-medium tabular-nums">{item.amount}</Table.Cell>
                  <Table.Cell>
                    <Chip color={item.tone} size="sm" variant="soft">
                      {t(`preview.status.${item.statusKey}`)}
                    </Chip>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      <div className="mt-4 flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Iconify
            className="size-6 rounded-md bg-accent p-1 text-accent-foreground"
            icon="arrows-rotate-right"
          />
          <div>
            <p className="text-xs font-semibold text-foreground">
              {t("preview.billing.autoChargeTitle")}
            </p>
            <p className="text-xs text-muted">{t("preview.billing.autoChargeNote")}</p>
          </div>
        </div>
        <Switch defaultSelected size="sm">
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Content>
        </Switch>
      </div>
    </div>
  );
}

export function ProductPreview() {
  const { t } = useI18n();

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)]">
      <ChromeBar />
      <Tabs defaultSelectedKey="schedule">
        <div className="border-b border-border px-4 pt-3">
          <Tabs.ListContainer>
            <Tabs.List aria-label={t("sports.showcase")}>
              <Tabs.Tab id="schedule">
                <span className="flex items-center gap-1.5">
                  <Iconify className="size-4" icon="calendar" />
                  {t("preview.tabSchedule")}
                </span>
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="billing">
                <span className="flex items-center gap-1.5">
                  <Iconify className="size-4" icon="credit-card" />
                  {t("preview.tabBilling")}
                </span>
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </div>
        <Tabs.Panel id="schedule">
          <SchedulePanel />
        </Tabs.Panel>
        <Tabs.Panel id="billing">
          <BillingPanel />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
