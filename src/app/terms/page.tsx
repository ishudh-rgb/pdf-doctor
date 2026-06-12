import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageContent } from "@/components/marketing/legal-page-content";

export const metadata: Metadata = {
  title: "Terms of Service | Only4PDF",
  description:
    "Read the Terms of Service for Only4PDF. Understand your rights and responsibilities when using our PDF tools.",
};

export default function TermsPage() {
  return (
    <LegalPageContent title="Terms of Service" lastUpdated="May 22, 2026">
          <div className="space-y-10">
            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                1. Acceptance of Terms
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                <p>
                  By accessing or using Only4PDF (&ldquo;the Service&rdquo;),
                  you agree to be bound by these Terms of Service. If you do not
                  agree to these terms, please do not use the Service.
                </p>
                <p>
                  We reserve the right to update these terms at any time.
                  Continued use of the Service after changes constitutes
                  acceptance of the modified terms.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                2. Description of Service
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                <p>
                  Only4PDF provides online PDF tools including but not limited
                  to: merging, splitting, compressing, converting, editing,
                  signing, protecting, unlocking, scanning, and AI-powered
                  summarization of PDF documents.
                </p>
                <p>
                  The Service is available in both a free tier (with daily usage
                  limits) and a paid Pro tier (with enhanced limits and additional
                  features).
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                3. User Accounts
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                <p>
                  Some features require creating an account. When registering,
                  you agree to:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Provide accurate and complete information.</li>
                  <li>Maintain the security of your account credentials.</li>
                  <li>Notify us immediately of any unauthorized access.</li>
                  <li>Accept responsibility for all activities under your account.</li>
                </ul>
                <p>
                  Guest users may access basic tools without an account, subject
                  to stricter usage limits.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                4. Acceptable Use
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                <p>You agree not to use the Service to:</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    Upload, process, or distribute illegal, harmful, or offensive
                    content.
                  </li>
                  <li>
                    Violate any copyright, trademark, or intellectual property
                    rights of others.
                  </li>
                  <li>Attempt to gain unauthorized access to our systems.</li>
                  <li>Use automated scripts or bots to abuse the Service.</li>
                  <li>Interfere with or disrupt the Service for other users.</li>
                  <li>Circumvent usage limits or security measures.</li>
                </ul>
                <p className="rounded-lg bg-amber-50 p-3 text-amber-800">
                  <strong>Regarding Unlock PDF:</strong> The Unlock PDF tool is
                  intended only for removing passwords from PDFs you own or have
                  authorization to access. Using this tool to bypass security on
                  PDFs you do not own is prohibited and may violate applicable
                  laws. Only4PDF is not responsible for misuse of this tool.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                5. File Upload Policy
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>Auto-Deletion:</strong> All uploaded files are
                    automatically deleted after 2 hours (24 hours for Pro users).
                    This is non-negotiable and cannot be extended.
                  </li>
                  <li>
                    <strong>File Size:</strong> There is no file size limit.
                    All tools accept PDFs and documents of any size, subject to
                    your device and network capabilities.
                  </li>
                  <li>
                    <strong>Daily Limits:</strong> Free users: 5 tool uses per
                    day. Pro users: 100 tool uses per day.
                  </li>
                  <li>
                    <strong>Supported Formats:</strong> Only PDF, DOCX, DOC, JPG,
                    JPEG, and PNG files are accepted depending on the tool.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                6. Payment and Subscriptions
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    Pro subscriptions are billed monthly or annually through
                    Razorpay.
                  </li>
                  <li>
                    All prices are displayed in Indian Rupees (INR) and include
                    applicable taxes.
                  </li>
                  <li>
                    Subscriptions auto-renew unless cancelled before the billing
                    date.
                  </li>
                  <li>
                    We reserve the right to change pricing with 30 days&apos;
                    notice.
                  </li>
                  <li>
                    Failure of payment may result in temporary suspension of Pro
                    features.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                7. Refund Policy
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    We offer a 7-day money-back guarantee on new Pro
                    subscriptions.
                  </li>
                  <li>
                    Refund requests must be submitted within 7 days of the
                    initial purchase.
                  </li>
                  <li>
                    Refunds are not available for renewal payments or after the
                    7-day window.
                  </li>
                  <li>
                    Refunds are processed within 5-7 business days to the
                    original payment method.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                8. Intellectual Property
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                <p>
                  The Service, including its design, code, features, and
                  branding, is owned by Only4PDF. You retain full ownership of
                  any files you upload — we claim no rights over your content.
                </p>
                <p>
                  You may not copy, modify, distribute, or reverse-engineer any
                  part of the Service without explicit written permission.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                9. Limitation of Liability
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                <p>
                  To the maximum extent permitted by law, Only4PDF shall not be
                  liable for:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    Any indirect, incidental, special, or consequential damages.
                  </li>
                  <li>Loss of data, profits, or business opportunities.</li>
                  <li>
                    Service interruptions, downtime, or technical failures.
                  </li>
                  <li>
                    Damages resulting from unauthorized access to your account.
                  </li>
                </ul>
                <p>
                  Our total liability to you shall not exceed the amount you paid
                  us in the 12 months preceding the claim.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                10. Disclaimer
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                <p>
                  The Service is provided &ldquo;as is&rdquo; and &ldquo;as
                  available&rdquo; without warranties of any kind.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong>PDF Conversions:</strong> Conversion accuracy
                    (especially PDF to Word) depends on the complexity of the
                    source document. Formatting, fonts, and layout may not be
                    perfectly preserved in all cases.
                  </li>
                  <li>
                    <strong>AI Summarizer:</strong> AI-generated summaries are
                    provided for informational purposes only. They may contain
                    inaccuracies and should not be relied upon as a substitute
                    for reading the original document.
                  </li>
                  <li>
                    <strong>Unlock PDF:</strong> The unlock tool works only on
                    PDFs with certain types of password protection. We do not
                    guarantee success for all encrypted PDFs, and this tool
                    should only be used on documents you have the right to
                    access.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                11. Termination
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                <p>
                  We may suspend or terminate your account at any time if you
                  violate these terms. Upon termination:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Your access to the Service will be revoked immediately.</li>
                  <li>Any pending files will be deleted.</li>
                  <li>
                    No refund will be provided for the remaining subscription
                    period if termination is due to a violation.
                  </li>
                </ul>
                <p>
                  You may also delete your account at any time from your
                  dashboard settings.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                12. Governing Law
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                <p>
                  These Terms shall be governed by and construed in accordance
                  with the laws of India. Any disputes arising from these terms
                  shall be subject to the exclusive jurisdiction of the courts
                  in New Delhi, India.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                13. Contact
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                <p>
                  If you have any questions about these Terms, please contact us:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    Email:{" "}
                    <a
                      href="mailto:support@only4pdf.com"
                      className="text-blue-600 hover:underline"
                    >
                      support@only4pdf.com
                    </a>
                  </li>
                  <li>
                    Contact Page:{" "}
                    <Link href="/contact" className="text-blue-600 hover:underline">
                      only4pdf.com/contact
                    </Link>
                  </li>
                </ul>
              </div>
            </section>
          </div>
    </LegalPageContent>
  );
}
