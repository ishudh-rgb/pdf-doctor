import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageContent } from "@/components/marketing/legal-page-content";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Cookie Policy",
  description:
    "Learn how OnlyMyPDF uses cookies — essential, analytics, and marketing — and how to manage your preferences.",
  path: "/cookies",
});

export default function CookiesPage() {
  return (
    <LegalPageContent title="Cookie Policy" lastUpdated="June 5, 2026">
      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-gray-900">What are cookies?</h2>
          <p className="mt-3">
            Cookies are small text files stored on your device. OnlyMyPDF uses cookies to keep the
            service secure, remember preferences, and — only with your consent — support analytics
            or marketing.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">Cookie categories</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>Essential (always on):</strong> authentication, security, guest session
              binding, and load balancing. Legal basis: legitimate interest / contract (GDPR Art.
              6(1)(b)(f)).
            </li>
            <li>
              <strong>Analytics (optional):</strong> anonymous usage statistics to improve tools.
              Legal basis: consent (Art. 6(1)(a)). Disabled until you accept.
            </li>
            <li>
              <strong>Marketing (optional):</strong> ad personalization if ads are enabled. Legal
              basis: consent (Art. 6(1)(a)). Disabled until you accept.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">Cookies we set</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[32rem] border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 pr-4 font-semibold">Name</th>
                  <th className="py-2 pr-4 font-semibold">Purpose</th>
                  <th className="py-2 font-semibold">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-2 pr-4 font-mono">pd_guest_session</td>
                  <td className="py-2 pr-4">Bind guest uploads to your browser (security)</td>
                  <td className="py-2">12 months</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono">pd_consent</td>
                  <td className="py-2 pr-4">Store cookie preference choices</td>
                  <td className="py-2">12 months</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono">Supabase auth</td>
                  <td className="py-2 pr-4">Login session when you sign in</td>
                  <td className="py-2">Session / refresh</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">Managing preferences</h2>
          <p className="mt-3">
            Use the cookie banner on your first visit, or clear cookies in your browser settings.
            Logged-in users can also visit{" "}
            <Link href="/dashboard/settings" className="text-blue-600 hover:underline">
              Dashboard → Privacy & data
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">Third-party cookies</h2>
          <p className="mt-3">
            Payment processing (Razorpay) may set cookies during checkout. Google AdSense cookies are
            only loaded if marketing cookies are accepted and ads are enabled. See our{" "}
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>{" "}
            for subprocessors.
          </p>
        </section>
      </div>
    </LegalPageContent>
  );
}
