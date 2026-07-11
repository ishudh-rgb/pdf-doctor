const RAZORPAY_SCRIPT = "https://checkout.razorpay.com";
const GOOGLE_APIS = "https://apis.google.com";
const DROPBOX = "https://www.dropbox.com";

export function buildContentSecurityPolicy(nonce: string, isProd: boolean): string {
  const scriptSrc = isProd
    ? `'self' 'nonce-${nonce}' 'strict-dynamic' ${RAZORPAY_SCRIPT} ${GOOGLE_APIS} ${DROPBOX}`
    : `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' ${RAZORPAY_SCRIPT} ${GOOGLE_APIS} ${DROPBOX}`;

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' blob: https://*.supabase.co https://*.supabase.in https://api.razorpay.com https://www.googleapis.com https://api.dropboxapi.com",
    "frame-src 'self' blob: https://checkout.razorpay.com https://docs.google.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}
