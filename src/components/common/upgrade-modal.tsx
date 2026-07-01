"use client";

import Link from "next/link";
import { Zap, Check, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { PRO_PRICING, FILE_SIZE_MARKETING } from "@/config/constants";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const freeFeatures = [
  { text: "5 tool uses per day", included: true },
  { text: FILE_SIZE_MARKETING.freeLabel, included: true },
  { text: "Basic PDF tools", included: true },
  { text: "Sign PDF (Pro only)", included: false },
  { text: "AI summarizer (limited)", included: false },
];

const proFeatures = [
  { text: "100 tool uses per day", included: true },
  { text: FILE_SIZE_MARKETING.proLabel, included: true },
  { text: "All tools including Sign PDF", included: true },
  { text: "Unlimited AI summaries", included: true },
  { text: "24-hour file retention", included: true },
];

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
          <Zap className="h-6 w-6 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Your daily limit is reached</h2>
        <p className="mt-2 text-sm text-gray-500">
          Upgrade to Pro for 100 daily uses and premium tools.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Free</h3>
          <p className="mt-1 text-2xl font-bold text-gray-900">₹0</p>
          <ul className="mt-4 space-y-2">
            {freeFeatures.map((f) => (
              <li key={f.text} className="flex items-center gap-2 text-sm">
                {f.included ? (
                  <Check className="h-4 w-4 shrink-0 text-green-500" />
                ) : (
                  <X className="h-4 w-4 shrink-0 text-gray-300" />
                )}
                <span className={cn(f.included ? "text-gray-700" : "text-gray-400")}>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative rounded-2xl border-2 border-blue-600 bg-blue-50/30 p-4">
          <span className="absolute -top-2.5 right-3 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
            POPULAR
          </span>
          <h3 className="text-sm font-semibold text-blue-700">Pro</h3>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            ₹{PRO_PRICING.monthlyInr}
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
        <Link href="/dashboard/pricing" onClick={onClose}>
          <Button variant="gradient" size="lg" className="w-full">
            <Zap className="h-4 w-4" />
            Upgrade to Pro
          </Button>
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full cursor-pointer text-center text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          Maybe later
        </button>
      </div>
    </Modal>
  );
}
