import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/app/_utils/supabase/adminClient';

const relevantEvents = new Set([
  'subscription.authenticated',
  'subscription.activated',
  'subscription.completed',
  'subscription.charged',
  'subscription.pending',
  'subscription.halted',
  'subscription.cancelled',
  'subscription.expired',
  'subscription.updated',
  'subscription.paused',
  'subscription.resumed',
]);

const supabaseAdmin = createAdminClient();

const upsertSubscription = async (subscription: any) => {
  const { id, entity, plan_id, customer_id, status, current_start, current_end, ended_at, quantity, note, charge_at, offer_id, start_at, end_at, auth_attempts, total_count, paid_count, customer_notify, created_at, expire_by, short_url, has_scheduled_changes, schedule_change_at, remaining_count } = subscription;

  const { data, error } = await supabaseAdmin
    .from('Subscription')
    .upsert({
      id,
      entity,
      "planId": plan_id,
      "customerId": customer_id,
      status,
      "currentStart": current_start,
      "currentEnd": current_end,
      "endedAt": ended_at,
      quantity,
      note,
      "chargeAt": charge_at,
      "offerId": offer_id,
      "startAt": start_at,
      "endAt": end_at,
      "authAttempts": auth_attempts,
      "totalCount": total_count,
      "paidCount": paid_count,
      "customerNotify": customer_notify,
      "createdAt": created_at,
      "expireBy": expire_by,
      "shortUrl": short_url,
      "hasScheduledChanges": has_scheduled_changes,
      "scheduledChangeAt": schedule_change_at,
      "remainingCount": remaining_count
    });

  if (error) {
    throw new Error(`Supabase upsert error: ${error.message}`);
  }
  return data;
};

const fetchSubscription = async (subscriptionId: any) => {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID!;
    const keySecret = process.env.RAZORPAY_KEY_SECRET!;

    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch(`${process.env.RAZORPAY_URL}subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData }, { status: response.status });
    }
    const data = await response.json();
    return data
  } catch (error) {
    console.error('Error fetching subscription:', error);
    throw error;
  }
};

const cancelSubscription = async (subscriptionId: string) => {
  const { data, error } = await supabaseAdmin
    .from('Subscription')
    .update({ status: 'cancelled' })
    .match({ id: subscriptionId });

  if (error) {
    throw new Error(`Supabase update error: ${error.message}`);
  }
  return data;
};

export const POST = async (req: NextRequest) => {
  const body = await req.text();
  const sig = req.headers.get('x-razorpay-signature');
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  try {
    if (!sig || !webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret not found.' }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (sig !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
    }

    const event = JSON.parse(body);
    console.log(`🔔  Webhook received: ${event.event}`);

    if (relevantEvents.has(event.event)) {
      try {
        const subscription = event.payload.subscription.entity;
        const subDetails = await fetchSubscription(subscription.id)
        switch (event.event) {
          case 'subscription.authenticated':
          case 'subscription.activated':
          case 'subscription.charged':
          case 'subscription.completed':
          case 'subscription.pending':
          case 'subscription.halted':
          case 'subscription.expired':
          case 'subscription.updated':
          case 'subscription.paused':
          case 'subscription.resumed':
            await upsertSubscription(subDetails);
            break;
          case 'subscription.cancelled':
            await cancelSubscription(subscription.id);
            break;
          default:
            throw new Error('Unhandled relevant event!');
        }
      } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Webhook handler failed. View your Next.js function logs.' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: `Unsupported event type: ${event.event}` }, { status: 400 });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.log(`❌ Error message: ${error.message}`);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }
};