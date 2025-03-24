'use server';

import { createAdminClient } from '@/app/_utils/supabase/adminClient';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

interface LeaveHistoryParams {
  userId?: string;
  teamId?: string;
}

export async function logoutAction() {
  revalidatePath('/', 'layout');
  redirect('/');
}

interface getUserDataProps {
  id: string;
  slackId?: string;
  googleId?: string;
}
const supabaseAdmin = createAdminClient();

export async function getUserData({ id, slackId, googleId }: getUserDataProps) {
  const { data: userData, error: userError } = await supabaseAdmin
    .from('User')
    .select('*,Team(name),Organisation(notificationToWhom)')
    .eq(`${slackId ? 'slackId' : 'googleId'}`, id)
    .single();

  if (userData) {
    return userData;
  } else {
    return userError;
  }
}

export const addSubscriptionToOrg = async (
  orgId: string,
  subscriptionId: string
) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('Organisation')
      .update({ subscriptionId })
      .eq('orgId', orgId);

    if (error) {
      throw new Error(
        `Failed to add subscription ID to organisation: ${error.message}`
      );
    }
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const fetchInvoices = async (subscriptionId: any) => {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID!;
    const keySecret = process.env.RAZORPAY_KEY_SECRET!;

    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch(
      `${process.env.RAZORPAY_URL}invoices?subscription_id=${subscriptionId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData },
        { status: response.status }
      );
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
};

export const cancelSubscription = async (subscriptionId: any) => {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID!;
    const keySecret = process.env.RAZORPAY_KEY_SECRET!;

    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch(
      `${process.env.RAZORPAY_URL}subscriptions/${subscriptionId}/cancel`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
        },
        body: JSON.stringify({
          cancel_at_cycle_end: 0,
        }),
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData },
        { status: response.status }
      );
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
};

export const getQuantity = async (orgId: string) => {
  const { data, error } = await supabaseAdmin
    .from('User')
    .select('userId', { count: 'exact' })
    .eq('orgId', orgId);
  if (error) {
    console.log(error);
  }
  return data?.length;
};

export const insertData = async (res: any) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_signature,
      razorpay_subscription_id,
    } = res;
    const data = await supabaseAdmin.from('PaySubMap').insert({
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      razorpaySubscriptionId: razorpay_subscription_id,
    });
  } catch (error) {
    console.error('Error inserting data:', error);
  }
};

export const getSubDetails = async (subscriptionId: string) => {
  const { data, error } = await supabaseAdmin
    .from('Subscription')
    .select('*')
    .eq('id', subscriptionId)
    .single();
  if (error) {
    console.log(error);
  }
  return data;
};

export const contactUs = async ({
  firstName,
  lastName,
  email,
  message,
}: {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
  recaptchaToken: string;
}) => {
  const { data, error } = await supabaseAdmin
    .from('ContactEmail')
    .insert({
      firstName,
      lastName,
      email,
      message,
    })
    .select();
  return data;
};
