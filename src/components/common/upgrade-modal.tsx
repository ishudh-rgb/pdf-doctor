"use client";

import { Zap, Check, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const freeFeatures = [
  { text: "2 files per day", included: true },
  { text: "Max 15MB file size", included: true },
  { text: "Basic tools only", included: true },
  { text: "Ads shown", included: false },
  { text: "No AI tools", included: false },
  { text: "No batch processing", included: false },
];

const proFeatures = [
  { text: "Unlimited files", included: true },
  { text: "Max 100MB file size", included: true },
  { text: "All tools unlocked", included: true },
  { text: "Ad-free experience", included: true },
  { text: "AI PDF tools", included: true },
  { text: "Batch processing", included: true },
];

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
          <Zap className="h-6 w-6 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          Your free daily limit is over
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Upgrade to Pro for unlimited access to all tools.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {/* Free Tier */}
        <div className="rounded-2xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Free</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            $0
            <span className="text-sm font-normal text-gray-500">/mo</span>
          </p>
          <ul className="mt-4 space-y-2">
            {freeFeatures.map((f) => (
              <li key={f.text} className="flex items-center gap-2 text-sm">
                {f.included ? (
                  <Check className="h-4 w-4 shrink-0 text-green-500" />
                ) : (
                  <X className="h-4 w-4 shrink-0 text-gray-300" />
                )}
                <span
                  className={cn(
                    f.included ? "text-gray-700" : "text-gray-400"
                  )}
                >
                  {f.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pro Tier */}
        <div className="rounded-2xl border-2 border-blue-600 bg-blue-50/30 p-4 relative">
          <span className="absolute -top-2.5 right-3 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
            POPULAR
          </span>
          <h3 className="text-sm font-semibold text-blue-700">Pro</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            $9
            <span className="text-sm font-normal text-gray-500">/mo</span>
          </p>
          <ul className="mt-4 space-y-2">
            {proFeatures.map((f) => (
              <li key={f.text} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 shrink-0 text-blue-600" />
                <span className="text-gray-700">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6">
        <Button variant="gradient" size="lg" className="w-full">
          <Zap className="h-4 w-4" />
          Upgrade to Pro
        </Button>
        <button
          onClick={onClose}
          className="mt-3 w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
        >
          Maybe later
        </button>
      </div>
    </Modal>
  );
}
