"use client";

import { UpgradeModal } from "@/components/common/upgrade-modal";
import { useAppStore } from "@/stores/app-store";

export function AppChromeExtras() {
  const showUpgradeModal = useAppStore((s) => s.showUpgradeModal);
  const setShowUpgradeModal = useAppStore((s) => s.setShowUpgradeModal);

  return (
    <UpgradeModal
      open={showUpgradeModal}
      onClose={() => setShowUpgradeModal(false)}
    />
  );
}
