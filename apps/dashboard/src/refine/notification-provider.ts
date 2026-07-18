import { toast } from "@heroui/react";
import type { NotificationProvider } from "@refinedev/core";

const keyToToastId = new Map<string, string>();

export const notificationProvider: NotificationProvider = {
  open: ({ key, message, description, type }) => {
    const variant = type === "success" ? "success" : type === "error" ? "danger" : "accent";

    const toastId = toast(message, {
      description,
      isLoading: type === "progress",
      timeout: type === "progress" ? 0 : 4000,
      variant,
    });

    if (key) keyToToastId.set(key, toastId);
  },
  close: (key) => {
    const toastId = keyToToastId.get(key);

    if (toastId) {
      toast.close(toastId);
      keyToToastId.delete(key);
    }
  },
};
