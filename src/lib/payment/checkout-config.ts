export function isRazorpayCheckoutConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim());
}
