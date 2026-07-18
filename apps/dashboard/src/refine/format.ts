export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" }).format(value);

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(value),
  );

type ChipColor = "success" | "accent" | "warning" | "danger" | "default";

export const orderStatusColor: Record<string, ChipColor> = {
  Cancelled: "danger",
  Delivered: "success",
  "On The Way": "accent",
  Pending: "warning",
  Ready: "accent",
  Rejected: "danger",
};
