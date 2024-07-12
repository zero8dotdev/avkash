"use client";
import { useEffect, useState } from 'react';
import { createClient } from "../_utils/supabase/client";
import { useSearchParams } from 'next/navigation';
import { Card, Typography, Button } from 'antd';

const { Title, Text } = Typography;

interface Subscription {
  id: string;
  quantity: number;
  current_period_start: string;
  current_period_end: string;
}

interface Price {
  id: string;
  type: string;
  unit_amount: number;
}

const supabase = createClient();

const Subscriptions = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [price, setPrice] = useState<Price | null>(null);
  const searchParams = useSearchParams();
  const price_id = searchParams.get('price_id');

  useEffect(() => {
    const fetchData = async () => {
      if (!price_id) return;

      // Fetch subscription details
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('price_id', price_id)
        .eq('user_id', 'af1c4de5-87e2-4a0b-89d5-f91733c3e1db');

      if (subError) {
        console.error(subError);
      } else {
        setSubscription(subData[0]);
      }

      const { data: priceData, error: priceError } = await supabase
        .from('prices')
        .select('*')
        .eq('id', price_id);

      if (priceError) {
        console.error(priceError);
      } else {
        setPrice(priceData[0]); 
      }
    };

    fetchData();
  }, [price_id]);

  const cancelSubscription = async (id: string) => {
    alert(`Cancel subscription with id: ${id}`);
  };

  const fetchInvoices = async (id: string) => {
    alert(`Fetch invoices for subscription with id: ${id}`);
  };

  if (!subscription || !price) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <Title style={{ textAlign: 'center', marginBottom: '40px' }}>Your Subscription Details</Title>
      <Card style={{ marginBottom: '20px' }}>
        <Title level={4}>Plan: Pro Plan</Title>
        <Text>Price: ₹{price.unit_amount / 100}</Text>
        <br />
        <Text>No of users: {subscription.quantity}</Text>
        <br />
        <Text>Start Period: {new Date(subscription.current_period_start).toLocaleDateString()}</Text>
        <br />
        <Text>End Period: {new Date(subscription.current_period_end).toLocaleDateString()}</Text>
        <br />
        <Text>Plan type: {price.type}</Text>
        <br />
        <Button type="primary" onClick={() => cancelSubscription(subscription.id)} style={{ marginRight: '10px' }}>
          Cancel Subscription
        </Button>
        <Button type="default" onClick={() => fetchInvoices(subscription.id)}>
          Fetch Invoices
        </Button>
      </Card>
    </div>
  );
};

export default Subscriptions;
