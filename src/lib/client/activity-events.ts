export const ACTIVITY_UPDATED_EVENT = "pdf-doctor:activity-updated";

export function notifyActivityUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ACTIVITY_UPDATED_EVENT));
}
