import { createAdminClient } from '@/app/_utils/supabase/adminClient';
import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const supabaseAdmin = createAdminClient();
export const POST = async (req: NextRequest) => {
  try {
    const { plan_id, org_id } = await req.json();
    if (!plan_id || !org_id) {
      throw new Error('Missing plan_id or org_id in the request body');
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const quantity = await getQuantity(org_id);

    const subscription = await razorpay.subscriptions.create({
      plan_id,
      customer_notify: 1,
      total_count: 12,
      quantity,
    });
    return NextResponse.json({
      subscription,
      key_id: process.env.RAZORPAY_KEY_ID!,
    });
  } catch (error: any) {
    console.error('Subscription creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

async function getQuantity(org_id: string): Promise<any> {
  const { data, error } = await supabaseAdmin
    .from('User')
    .select('userId', { count: 'exact' })
    .eq('orgId', org_id);
  if (error) {
    console.log(error);
  }
  return data?.length;
}
