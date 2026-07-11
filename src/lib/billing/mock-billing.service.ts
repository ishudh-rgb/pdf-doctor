import crypto from "crypto";

export function createMockOrderId(): string {
  return `order_mock_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function createMockPaymentId(): string {
  return `pay_mock_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function createMockSubscriptionId(): string {
  return `sub_mock_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function createMockPaymentSignature(orderId: string, paymentId: string): string {
  const digest = crypto.createHash("sha256").update(`${orderId}|${paymentId}`).digest("hex");
  return `mock_${digest}`;
}

export function isMockOrderId(id: string): boolean {
  return id.startsWith("order_mock_");
}

export function isMockPaymentId(id: string): boolean {
  return id.startsWith("pay_mock_");
}

export function isMockSubscriptionId(id: string): boolean {
  return id.startsWith("sub_mock_");
}

export function verifyMockPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  return signature === createMockPaymentSignature(orderId, paymentId);
}
