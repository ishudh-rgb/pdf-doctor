export function PrivacyGdprSections() {
  return (
    <div className="mb-10 space-y-8 rounded-2xl border border-blue-100 bg-blue-50/50 p-6">
      <section>
        <h2 className="text-xl font-semibold text-gray-900">Legal basis for processing (GDPR)</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed">
          <li>
            <strong>Contract (Art. 6(1)(b)):</strong> providing PDF tools, accounts, and Pro
            subscriptions you request.
          </li>
          <li>
            <strong>Legitimate interest (Art. 6(1)(f)):</strong> security, fraud prevention, hashed
            IP usage metering, and service improvement.
          </li>
          <li>
            <strong>Consent (Art. 6(1)(a)):</strong> optional analytics/marketing cookies and
            marketing communications where applicable.
          </li>
          <li>
            <strong>Legal obligation (Art. 6(1)(c)):</strong> tax and payment records where required
            by law.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900">Data retention</h2>
        <div className="mt-3 overflow-x-auto text-sm">
          <table className="w-full min-w-[32rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 pr-4 font-semibold">Data type</th>
                <th className="py-2 font-semibold">Retention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-2 pr-4">Uploaded PDFs (free)</td>
                <td className="py-2">Auto-deleted within 2 hours</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Uploaded PDFs (Pro)</td>
                <td className="py-2">Auto-deleted within 24 hours</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Account profile</td>
                <td className="py-2">Until account deletion</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Payment records</td>
                <td className="py-2">7 years (legal/tax requirements)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Usage logs (hashed IP)</td>
                <td className="py-2">90 days, then aggregated or deleted</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Consent records</td>
                <td className="py-2">3 years from consent date</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900">Subprocessors</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed">
          <li>
            <strong>Supabase</strong> (EU/US) — database, authentication, encrypted file storage
          </li>
          <li>
            <strong>Razorpay</strong> (India) — payment processing; PCI-DSS compliant
          </li>
          <li>
            <strong>Resend</strong> — transactional email (password reset)
          </li>
          <li>
            <strong>AI providers</strong> (Pro summarizer only) — document text processed ephemerally;
            not used to train models
          </li>
          <li>
            <strong>Upstash</strong> (optional) — distributed rate limiting
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900">International transfers</h2>
        <p className="mt-3 text-sm leading-relaxed">
          Data may be processed in India and where our subprocessors operate. We use contractual
          safeguards and platform security measures (TLS, access controls) appropriate to the
          service.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900">Privacy contact & complaints</h2>
        <p className="mt-3 text-sm leading-relaxed">
          Data protection contact:{" "}
          <a href="mailto:privacy@onlymypdf.com" className="text-blue-600 hover:underline">
            privacy@onlymypdf.com
          </a>
          . You may lodge a complaint with your local supervisory authority. EU users may contact
          their national Data Protection Authority.
        </p>
      </section>
    </div>
  );
}
