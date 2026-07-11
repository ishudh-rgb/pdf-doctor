import { NextResponse } from "next/server";
import { tryGetApiUser } from "@/lib/auth/get-api-user";
import { listUserInvoices } from "@/lib/billing/invoice.service";

export async function GET() {
  const auth = await tryGetApiUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const invoices = await listUserInvoices(user.id);
  return NextResponse.json({
    invoices: invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      amountInr: inv.amount_paise / 100,
      taxInr: inv.tax_paise / 100,
      status: inv.status,
      issuedAt: inv.issued_at,
    })),
  });
}
