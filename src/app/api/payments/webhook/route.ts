import { NextRequest, NextResponse } from "next/server";

import { verifyWebhookSignature } from "@/lib/services/payment.service";

import { fulfillPendingPayment } from "@/lib/services/payment-fulfillment.service";

import {

  handlePaymentFailedWebhook,

  handlePaymentRefundedWebhook,

  handleSubscriptionHaltedWebhook,

} from "@/lib/services/payment-webhook-handlers.service";

import { fulfillSubscriptionCharge, cancelLocalSubscription } from "@/lib/services/subscription-fulfillment.service";

import { renewOrganizationPlanFromWebhook, clearOrganizationAutoRenewByRazorpaySub } from "@/lib/enterprise/org-billing.service";

import { guardWebhookRateLimit } from "@/lib/server/rate-limiter";

import { captureApiError } from "@/lib/server/safe-error";



export async function POST(request: NextRequest) {

  const rateLimited = await guardWebhookRateLimit(request);

  if (rateLimited) return rateLimited;



  try {

    const body = await request.text();

    const signature = request.headers.get("x-razorpay-signature");



    if (!signature) {

      return NextResponse.json({ error: "Missing signature" }, { status: 400 });

    }



    const isValid = verifyWebhookSignature(body, signature);

    if (!isValid) {

      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

    }



    const event = JSON.parse(body);

    const eventType = event.event;

    const payload = event.payload;



    switch (eventType) {

      case "payment.captured": {

        const paymentEntity = payload.payment?.entity;

        if (!paymentEntity?.order_id || !paymentEntity?.id) break;



        const result = await fulfillPendingPayment({

          razorpay_order_id: paymentEntity.order_id,

          razorpay_payment_id: paymentEntity.id,

          payment_method: paymentEntity.method || null,

          amount: paymentEntity.amount,

          requireSignature: false,

        });



        if (!result.ok) {

          console.error("Webhook payment fulfillment failed:", result.error);

          captureApiError(new Error(result.error), {

            route: "payments/webhook",

            razorpay_order_id: paymentEntity.order_id,

            status: result.status,

          });

          if (result.status >= 400 && result.status < 500) {

            return NextResponse.json({

              received: true,

              skipped: true,

              reason: result.error,

            });

          }

          return NextResponse.json({ error: result.error }, { status: 500 });

        }

        break;

      }



      case "payment.failed": {

        const paymentEntity = payload.payment?.entity;

        if (paymentEntity) {

          await handlePaymentFailedWebhook(paymentEntity);

        }

        break;

      }



      case "refund.processed":

      case "refund.created": {

        const refundEntity = payload.refund?.entity;

        const paymentId = refundEntity?.payment_id;

        if (paymentId) {

          await handlePaymentRefundedWebhook(paymentId);

        }

        break;

      }



      case "subscription.charged": {

        const paymentEntity = payload.payment?.entity;

        const subscriptionEntity = payload.subscription?.entity;

        if (!paymentEntity?.id) break;



        const subId = subscriptionEntity?.id ?? paymentEntity.subscription_id;

        if (!subId) break;



        const orgRenewed = await renewOrganizationPlanFromWebhook({

          razorpaySubscriptionId: subId,

          amountPaise: paymentEntity.amount,

          paymentId: paymentEntity.id,

        });



        if (orgRenewed) break;



        const result = await fulfillSubscriptionCharge({

          razorpaySubscriptionId: subId,

          razorpayPaymentId: paymentEntity.id,

          amountPaise: paymentEntity.amount,

          paymentMethod: paymentEntity.method ?? null,

        });



        if (!result.ok && result.status >= 500) {

          return NextResponse.json({ error: result.error }, { status: 500 });

        }

        break;

      }



      case "subscription.halted": {

        const subscriptionEntity = payload.subscription?.entity;

        if (subscriptionEntity?.id) {

          await handleSubscriptionHaltedWebhook(subscriptionEntity.id);

        }

        break;

      }



      case "subscription.cancelled":

      case "subscription.completed": {

        const subscriptionEntity = payload.subscription?.entity;

        if (!subscriptionEntity?.id) break;



        const orgHandled = await clearOrganizationAutoRenewByRazorpaySub(subscriptionEntity.id);

        if (!orgHandled) {

          await cancelLocalSubscription(subscriptionEntity.id);

        }

        break;

      }



      case "subscription.updated": {

        const subscriptionEntity = payload.subscription?.entity;

        const paymentEntity = payload.payment?.entity;



        if (

          subscriptionEntity?.status === "halted" ||

          subscriptionEntity?.status === "past_due"

        ) {

          if (subscriptionEntity.id) {

            await handleSubscriptionHaltedWebhook(subscriptionEntity.id);

          }

          break;

        }



        if (subscriptionEntity?.status === "active" && paymentEntity?.id && paymentEntity?.subscription_id) {

          await fulfillSubscriptionCharge({

            razorpaySubscriptionId: paymentEntity.subscription_id,

            razorpayPaymentId: paymentEntity.id,

            amountPaise: paymentEntity.amount,

            paymentMethod: paymentEntity.method ?? null,

          });

        }

        break;

      }



      default:

        break;

    }



    return NextResponse.json({ received: true });

  } catch (err) {

    captureApiError(err, { route: "payments/webhook" });

    console.error("Webhook processing error:", err);

    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });

  }

}


