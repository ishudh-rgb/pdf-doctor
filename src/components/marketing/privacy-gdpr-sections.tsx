"use client";

import { useTranslation } from "@/i18n";

const COPY = {
  en: {
    legalTitle: "Legal basis for processing (GDPR)",
    legalBullets: [
      "Contract (Art. 6(1)(b)): providing PDF tools, accounts, and Pro subscriptions you request.",
      "Legitimate interest (Art. 6(1)(f)): security, fraud prevention, hashed IP usage metering, and service improvement.",
      "Consent (Art. 6(1)(a)): optional analytics/marketing cookies and marketing communications where applicable.",
      "Legal obligation (Art. 6(1)(c)): tax and payment records where required by law.",
    ],
    retentionTitle: "Data retention",
    retentionHeaders: ["Data type", "Retention"],
    retentionRows: [
      ["Uploaded PDFs (free)", "Auto-deleted within 2 hours"],
      ["Uploaded PDFs (Pro)", "Auto-deleted within 24 hours"],
      ["Account profile", "Until account deletion"],
      ["Payment records", "7 years (legal/tax requirements)"],
      ["Usage logs (hashed IP)", "90 days, then aggregated or deleted"],
      ["Consent records", "3 years from consent date"],
      ["Admin audit logs", "90 days"],
    ],
    subprocessorsTitle: "Subprocessors",
    subprocessors: [
      "Supabase (EU/US) — database, authentication, encrypted file storage",
      "Razorpay (India) — payment processing; PCI-DSS compliant",
      "Resend — transactional email (password reset)",
      "AI providers (Pro summarizer only) — document text processed ephemerally; not used to train models",
      "Upstash (optional) — distributed rate limiting",
    ],
    transfersTitle: "International transfers",
    transfers:
      "Data may be processed in India and where our subprocessors operate. We use contractual safeguards and platform security measures (TLS, access controls) appropriate to the service.",
    contactTitle: "Privacy contact & complaints",
    contactPrefix: "Data protection contact:",
    contactSuffix:
      "You may lodge a complaint with your local supervisory authority. EU users may contact their national Data Protection Authority.",
  },
  hi: {
    legalTitle: "प्रसंस्करण का कानूनी आधार (GDPR)",
    legalBullets: [
      "अनुबंध (Art. 6(1)(b)): आपके द्वारा अनुरोधित PDF टूल्स, खाते और Pro सब्सक्रिप्शन।",
      "वैध हित (Art. 6(1)(f)): सुरक्षा, धोखाधड़ी रोकथाम, हैश IP मीटरिंग और सेवा सुधार।",
      "सहमति (Art. 6(1)(a)): वैकल्पिक analytics/marketing कुकीज़ और marketing संचार।",
      "कानूनी दायित्व (Art. 6(1)(c)): कर और भुगतान रिकॉर्ड जहाँ कानून आवश्यक।",
    ],
    retentionTitle: "डेटा retention",
    retentionHeaders: ["डेटा प्रकार", "Retention"],
    retentionRows: [
      ["अपलोड PDF (फ्री)", "2 घंटे के भीतर ऑटो-डिलीट"],
      ["अपलोड PDF (Pro)", "24 घंटे के भीतर ऑटो-डिलीट"],
      ["खाता प्रोफ़ाइल", "खाता मिटाने तक"],
      ["भुगतान रिकॉर्ड", "7 वर्ष (कानूनी/कर)"],
      ["उपयोग लॉग (हैश IP)", "90 दिन, फिर aggregate/डिलीट"],
      ["Consent रिकॉर्ड", "सहमति से 3 वर्ष"],
      ["एडमिन audit लॉग", "90 दिन"],
    ],
    subprocessorsTitle: "Sub-processors",
    subprocessors: [
      "Supabase (EU/US) — डेटाबेस, प्रमाणीकरण, एन्क्रिप्टेड फ़ाइल स्टोरेज",
      "Razorpay (India) — भुगतान; PCI-DSS",
      "Resend — transactional ईमेल",
      "AI providers (Pro summarizer) — अस्थायी प्रसंस्करण; मॉडल प्रशिक्षण नहीं",
      "Upstash (वैकल्पिक) — distributed rate limiting",
    ],
    transfersTitle: "अंतर्राष्ट्रीय स्थानांतरण",
    transfers:
      "डेटा भारत और sub-processor स्थानों पर प्रसंस्कृत हो सकता है। TLS और access controls सहित उपयुक्त सुरक्षा उपाय।",
    contactTitle: "गोपनीयता संपर्क और शिकायत",
    contactPrefix: "डेटा संरक्षण संपर्क:",
    contactSuffix:
      "आप स्थानीय supervisory authority के पास शिकायत दर्ज कर सकते हैं। EU उपयोगकर्ता अपनी राष्ट्रीय DPA से संपर्क कर सकते हैं।",
  },
} as const;

export function PrivacyGdprSections() {
  const { language } = useTranslation();
  const c = COPY[language] ?? COPY.en;

  return (
    <div className="mb-10 space-y-8 rounded-2xl border border-blue-100 bg-blue-50/50 p-6">
      <section>
        <h2 className="text-xl font-semibold text-gray-900">{c.legalTitle}</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed">
          {c.legalBullets.map((item) => (
            <li key={item.slice(0, 32)}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900">{c.retentionTitle}</h2>
        <div className="mt-3 overflow-x-auto text-sm">
          <table className="w-full min-w-[32rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 pr-4 font-semibold">{c.retentionHeaders[0]}</th>
                <th className="py-2 font-semibold">{c.retentionHeaders[1]}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {c.retentionRows.map(([type, retention]) => (
                <tr key={type}>
                  <td className="py-2 pr-4">{type}</td>
                  <td className="py-2">{retention}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900">{c.subprocessorsTitle}</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed">
          {c.subprocessors.map((item) => (
            <li key={item.slice(0, 32)}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900">{c.transfersTitle}</h2>
        <p className="mt-3 text-sm leading-relaxed">{c.transfers}</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900">{c.contactTitle}</h2>
        <p className="mt-3 text-sm leading-relaxed">
          {c.contactPrefix}{" "}
          <a href="mailto:privacy@onlymypdf.com" className="text-blue-600 hover:underline">
            privacy@onlymypdf.com
          </a>
          . {c.contactSuffix}
        </p>
      </section>
    </div>
  );
}
