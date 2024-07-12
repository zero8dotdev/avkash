// src/app/products/page.tsx
"use client";
import { createClient } from "../_utils/supabase/client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Row, Col, Button, Badge, Typography, Spin } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  price_id: string;
}

interface Sub {
  id: string;
  user_id: string;
  status: string;
  price_id: string;
  current_period_start: string;
  current_period_end: string;
}

const supabase = createClient();

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [subs, setSubs] = useState<Sub[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          prices (
            unit_amount,
            id
          )
        `);

      if (productError) {
        console.error(productError);
      } else {
        const productsWithPrices = productData.map((product: any) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.prices.length > 0 ? product.prices[0].unit_amount / 100 : 0,
          price_id: product.prices.length > 0 ? product.prices[0].id : '',
        }));
        setProducts(productsWithPrices);
      }

      const { data: subDetails, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', 'af1c4de5-87e2-4a0b-89d5-f91733c3e1db');

      if (subError) {
        console.error(subError);
      } else {
        setSubs(subDetails);
      }
    };

    fetchData();
  }, []);

  const handlePurchase = async (productId: string) => {
    setLoading(productId);
    const res = await fetch('api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId }),
    });

    const { url } = await res.json();
    window.location.href = url;
  };

  const isSubscribed = (priceId: string) => {
    return subs.some(sub => sub.price_id === priceId);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f2f5' }}>
      <Title style={{ textAlign: 'center', marginBottom: '40px' }}>Product Prices</Title>
      <Row gutter={[16, 16]} justify="center">
        {products.map(product => (
          <Col key={product.id} xs={24} sm={12} md={8} lg={6}>
            <Badge.Ribbon text="New" color="green">
              <Card
                title={<Title level={4}>{product.name}</Title>}
                bordered={false}
                style={{
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  backgroundColor: '#fff',
                  textAlign: 'center',
                  overflow: 'hidden',
                  padding: '20px',
                }}
              >
                {isSubscribed(product.price_id) ? (
                  <div>
                    <Text type="success">You are already subscribed to this particular plan.</Text>
                    <p style={{ fontSize: '16px', marginTop: '10px' }}>
                      Now you can manage your users and leaves.
                    </p>
                    <Button
                      type="default"
                      style={{
                        borderRadius: '4px',
                        padding: '0 24px',
                        height: '40px',
                      }}
                      onClick={() => router.push(`/subscriptions?price_id=${product.price_id}`)}
                    >
                      Manage Subscription
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Text type="secondary">{product.description}</Text>
                    <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#3f8600', margin: '20px 0' }}>
                      ₹{product.price.toFixed(2)}
                    </p>
                    <Button
                      type="primary"
                      icon={loading === product.id ? <Spin /> : <ShoppingCartOutlined />}
                      onClick={() => handlePurchase(product.id)}
                      style={{
                        borderRadius: '4px',
                        backgroundColor: '#1890ff',
                        borderColor: '#1890ff',
                        padding: '0 24px',
                        height: '40px',
                      }}
                      disabled={loading === product.id}
                    >
                      {loading === product.id ? 'Processing...' : 'Purchase'}
                    </Button>
                  </div>
                )}
              </Card>
            </Badge.Ribbon>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Products;
