import type { Metadata } from "next";
import Link from "next/link";
import { PrivacyGdprSections } from "@/components/marketing/privacy-gdpr-sections";
import { LegalPageContent } from "@/components/marketing/legal-page-content";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { SUPPORT_EMAIL } from "@/config/constants";

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy Policy",
  description:
    "Learn how OnlyMyPDF handles your data, files, and personal information. Your privacy is our priority.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalPageContent title="Privacy Policy" lastUpdated="June 5, 2026">
          <PrivacyGdprSections />
          <div className="space-y-10">
            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                Information We Collect
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                <p>
                  When you use OnlyMyPDF, we may collect the following types of
                  information:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Account Information:</strong> Name, email address,
                    and password when you create an account.
                  </li>
                  <li>
                    <strong>Usage Data:</strong> Information about which tools
                    you use, file sizes, processing times, and frequency of use.
                  </li>
                  <li>
                    <strong>Payment Information:</strong> Billing details
                    processed securely through Razorpay. We do not store your
                    full card details on our servers.
                  </li>
                  <li>
                    <strong>Device identifiers:</strong> Browser type, operating
                    system, and a <strong>hashed</strong> IP address (we do not store raw IP
                    addresses in usage logs) for security and rate limiting.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                How We Use Your Information
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                <p>We use the information we collect to:</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Provide, maintain, and improve our PDF tools and services.</li>
                  <li>Process your transactions and manage your subscription.</li>
                  <li>Send you service-related communications and updates.</li>
                  <li>Monitor and analyze usage patterns to improve user experience.</li>
                  <li>Detect, prevent, and address technical issues and abuse.</li>
                  <li>Enforce our terms of service and applicable policies.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                File Handling and Privacy
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                <p>
                  Your file privacy is of utmost importance to us. Here is how
                  we handle your uploaded files:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Automatic Deletion:</strong> All uploaded files are
                    automatically and permanently deleted from our servers after
                    2 hours (24 hours for Pro users). No exceptions.
                  </li>
                  <li>
                    <strong>No Permanent Storage:</strong> We do not keep copies
                    of your files beyond the retention window. Once deleted, files
                    cannot be recovered.
                  </li>
                  <li>
                    <strong>Processing Only:</strong> Files are accessed only for
                    the purpose of performing the requested operation (merge,
                    split, compress, etc.).
                  </li>
                  <li>
                    <strong>No Human Access:</strong> Your files are processed
                    automatically. No OnlyMyPDF employee views or accesses your
                    file contents.
                  </li>
                  <li>
                    <strong>Encrypted Storage:</strong> While on our servers,
                    files are stored with encryption at rest.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                Cookies and Tracking
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                <p>We use cookies and similar technologies to:</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Keep you signed in to your account.</li>
                  <li>Remember your preferences and settings.</li>
                  <li>Understand how you interact with our service.</li>
                  <li>Serve relevant advertisements (for free-tier users).</li>
                </ul>
                <p>
                  You can control cookies through your browser settings. However,
                  disabling certain cookies may affect the functionality of our
                  service.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                Third-Party Services
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                <p>
                  We work with trusted third-party services to operate
                  OnlyMyPDF:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Supabase:</strong> Database and authentication
                    services. Your account data is stored securely on Supabase
                    infrastructure.
                  </li>
                  <li>
                    <strong>Razorpay:</strong> Payment processing for Pro
                    subscriptions. Razorpay handles all payment data in
                    compliance with PCI-DSS standards.
                  </li>
                  <li>
                    <strong>Google AdSense:</strong> Advertisement delivery for
                    free-tier users. Google may use cookies to serve ads based on
                    your browsing activity.
                  </li>
                  <li>
                    <strong>AI Providers:</strong> For the AI PDF Summarizer
                    tool, document text may be sent to AI model providers for
                    processing. These providers do not retain your data after
                    processing.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                Data Security
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                <p>
                  We implement industry-standard security measures to protect
                  your data:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>TLS/SSL encryption for all data in transit.</li>
                  <li>Encryption at rest for stored files and data.</li>
                  <li>Regular security audits and vulnerability assessments.</li>
                  <li>Access controls and authentication for all internal systems.</li>
                  <li>Isolated processing environments for file operations.</li>
                </ul>
                <p>
                  While we strive to protect your information, no method of
                  transmission over the Internet is 100% secure. We cannot
                  guarantee absolute security.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                Your Rights
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                <p>You have the right to:</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Access the personal data we hold about you.</li>
                  <li>Request correction of inaccurate personal data.</li>
                  <li>Request deletion of your account and associated data.</li>
                  <li>Export your account data in a portable format.</li>
                  <li>Opt out of marketing communications at any time.</li>
                  <li>Withdraw consent for data processing where applicable.</li>
                </ul>
                <p>
                  To exercise any of these rights, please contact us at{" "}
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="text-blue-600 hover:underline"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                  .
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                Children&apos;s Privacy
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                <p>
                  OnlyMyPDF is not intended for use by children under the age of
                  13. We do not knowingly collect personal information from
                  children under 13. If we become aware that a child under 13
                  has provided us with personal information, we will take steps
                  to delete such information.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                Changes to This Policy
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                <p>
                  We may update this Privacy Policy from time to time. We will
                  notify you of any changes by posting the new policy on this
                  page and updating the &ldquo;Last updated&rdquo; date. We
                  encourage you to review this page periodically for any changes.
                </p>
                <p>
                  Continued use of OnlyMyPDF after changes are posted
                  constitutes your acceptance of the revised policy.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                Contact Us
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                <p>
                  If you have any questions about this Privacy Policy or our data
                  practices, please contact us:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    Email:{" "}
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="text-blue-600 hover:underline"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                  </li>
                  <li>
                    Contact Page:{" "}
                    <Link href="/contact" className="text-blue-600 hover:underline">
                      Contact us
                    </Link>
                  </li>
                </ul>
              </div>
            </section>
          </div>
    </LegalPageContent>
  );
}
