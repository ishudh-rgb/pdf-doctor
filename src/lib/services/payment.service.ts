import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function createOrder(amount: number, currency: string = "INR", receipt: string) {
  const order = await razorpay.orders.create({
    amount,
    currency,
    receipt,
  });
  return order;
}

function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(b, "hex");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

function verifyHmac(body: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return timingSafeEqualHex(expected, signature);
}

export function verifyPayment(orderId: string, paymentId: string, signature: string): boolean {
  const body = orderId + "|" + paymentId;
  return verifyHmac(body, signature, process.env.RAZORPAY_KEY_SECRET!);
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const webhookSecret =
    process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET!;
  return verifyHmac(body, signature, webhookSecret);
}
