import { toast } from "sonner";

export type ToastVariant = "success" | "error";

interface ToastOptions {
  title: string;
  description?: string;
}

export function showToast(variant: ToastVariant, options: ToastOptions): void {
  if (variant === "success") {
    toast.success(options.title, {
      description: options.description,
      duration: 5000,
    });
  } else {
    toast.error(options.title, {
      description: options.description,
      duration: 5000,
    });
  }
}

export const toastSuccess = (options: ToastOptions): void => showToast("success", options);
export const toastError = (options: ToastOptions): void => showToast("error", options);
