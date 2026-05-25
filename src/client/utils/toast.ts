import { createKumoToastManager } from "@cloudflare/kumo";

export const toastManager = createKumoToastManager();

export function toastError(title: string, description?: string) {
  toastManager.add({ variant: "error", title, description });
}

export function toastSuccess(title: string, description?: string) {
  toastManager.add({ variant: "success", title, description });
}

export function withToast<T>(
  promise: Promise<T>,
  msgs: { loading: string; success: string; errorTitle?: string }
): Promise<T> {
  return toastManager.promise(promise, {
    loading: { title: msgs.loading },
    success: { variant: "success" as const, title: msgs.success },
    error: (e: Error) => ({
      variant: "error" as const,
      title: msgs.errorTitle ?? "Action failed",
      description: e.message
    })
  });
}
