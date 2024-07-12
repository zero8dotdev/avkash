import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/app/_utils/supabase/client'; 
import { calculateTrialEndUnixTimestamp } from '@/app/_utils/helpers';
import { createOrRetrieveCustomer } from '@/app/_utils/supabase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
});

const supabase = createClient();

export async function POST(req: Request) {
  const { productId } = await req.json();

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      name,
      description,
      prices (unit_amount,type,id)
    `)
    .eq('id', productId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  // const {
  //   data: { user }
  // } = await supabase.auth.getUser();
  // console.log("USER>>>>>>>>",user)
  // Retrieve or create the customer in Stripe
  let customer: string;
  try {
    customer = await createOrRetrieveCustomer({
      orgId: 'af1c4de5-87e2-4a0b-89d5-f91733c3e1db',
      email: 'zero8dev@gmail.com'
    });
  } catch (err) {
    console.error(err);
    throw new Error('Unable to access customer record.');
  }
  const price = product.prices.length > 0 ? product.prices[0].unit_amount : 0
  const mode = product.prices[0].type === 'recurring'? 'subscription' : 'payment'
  const session = await stripe.checkout.sessions.create({
    allow_promotion_codes: true,
    payment_method_types: ['card'],
    customer,
    customer_update: {
      address: 'auto'
    },
    billing_address_collection: 'required',
    line_items: [
      {
      //   price_data: {
      //   currency: 'inr',
      //   product_data: {
      //     name: product.name,
      //     description: product.description || 'desc',
      //   },
      //   unit_amount: price,
      // },
        price: product.prices[0].id,
        quantity: 1,
      },
    ],
    
    mode: mode,
    subscription_data: {
      trial_end: calculateTrialEndUnixTimestamp(price.trial_period_days)
    },
    success_url: `${req.headers.get('origin')}`,
    cancel_url: `${req.headers.get('origin')}/cancel`,
  });

  return NextResponse.json({ url: session.url });
}
