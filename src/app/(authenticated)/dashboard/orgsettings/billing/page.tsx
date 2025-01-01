"use client";
import { useEffect, useState } from "react";
import { Button, Typography, Card, Row, Col, Space } from "antd";
import { useApplicationContext } from "@/app/_context/appContext";
import { createClient } from "@/app/_utils/supabase/client";
import dayjs from "dayjs";
import {
  addSubscriptionToOrg,
  cancelSubscription,
  fetchInvoices,
  getQuantity,
  getSubDetails,
  insertData,
} from "@/app/_components/header/_components/actions";
import SideMenu from "../_components/menu";
import useSWR from "swr";

const { Text } = Typography;
const supabase = createClient();

declare global {
  interface Window {
    Razorpay: any;
  }
}

const SubscriptionButton: React.FC = () => {
  const { state: appState } = useApplicationContext();
  const [loading, setLoading] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [userCount, setUserCount] = useState<number>(0);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showInvoices, setShowInvoices] = useState(false);
  const [showSubscriptionDetails, setShowSubscriptionDetails] = useState(false);

  useEffect(() => {
    const fetchSubscriptionId = async () => {
      const { data, error } = await supabase
        .from("Organisation")
        .select("subscriptionId")
        .eq("orgId", appState.orgId)
        .single();
      if (error) {
        console.error("Error fetching subscriptionId:", error);
      } else {
        setSubscriptionId(data.subscriptionId);
        if (data.subscriptionId) {
          await fetchAndSetInvoices(data.subscriptionId);
          await handleViewSubscription(data.subscriptionId);
        }
      }
    };

    fetchSubscriptionId();
  }, [appState.orgId]);

  const userCountfetcher = async (orgId: string) => {
    const org = orgId.split("*")[1];
    const data = await getQuantity(org);
    return data;
  };

    const {
      data: userCountData,
      error,
      mutate,
    } = useSWR(`orgUserCount*${appState.orgId}`, userCountfetcher,  {
          onSuccess: (data) => {
            setUserCount(data ?? 0);
          },
        });

  const fetchAndSetInvoices = async (subscriptionId: string) => {
    try {
      const invoiceData = await fetchInvoices(subscriptionId);
      setInvoices(invoiceData.items);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan_id: "plan_OdEFjQN9QgESvv",
          org_id: appState.orgId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error:", errorData);
        throw new Error(errorData.error);
      }

      const data = await response.json();
      const { subscription, key_id } = data;
      if (!subscription || !key_id) {
        throw new Error("Invalid API response");
      }

      const options = {
        key: key_id,
        subscription_id: subscription.id,
        name: "Zero8.dev",
        description: "Monthly Subscription",
        prefill: {
          name: "Sri Hari",
          email: "hari@example.com",
          contact: "6281503334",
        },
        theme: {
          color: "#A52A2A",
        },
        handler: async (response: any) => {
          // window.location.href = '/success';
          await insertData(response);
          setSubscriptionId(subscription.id);
          await addSubscriptionToOrg(appState.orgId, subscription.id);
          fetchAndSetInvoices(subscription.id);
        },
        modal: {
          ondismiss: function () {
            window.location.href = "/cancel";
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Purchase error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (subscriptionId) {
      setLoading(true);
      try {
        await cancelSubscription(subscriptionId);
        setSubscriptionId(null);
        setInvoices([]);
      } catch (error) {
        console.error("Cancel subscription error:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewSubscription = async (subscriptionId: string) => {
    try {
      const subscriptionData = await getSubDetails(subscriptionId);
      setSubscriptionDetails(subscriptionData);
    } catch (error) {
      console.error("Error fetching subscription details:", error);
    }
  };

  const formatInvoiceTitle = (date: number) => {
    return dayjs(date * 1000).format("MMMM YYYY") + " Invoice";
  };

  return (
    <Row style={{ padding: "80px" }}>
      <Col span={3}>
        <SideMenu position="billing" />
      </Col>

      <Col span={16}>
        <Card style={{ marginTop: 16 }} title="Billing">
          <Text style={{ display: "block", marginBottom: 24 }}>
            You currently have {userCount} users.
          </Text>
          <Text
            strong
            style={{ color: "#3c8cd8", display: "block", marginBottom: 24 }}
          >
            अvkash costs ₹99 per user per month.
          </Text>
          <Text
            strong
            style={{ color: "#3c8cd8", display: "block", marginBottom: 16 }}
          >
            To ensure uninterrupted service, add your billing information. We
            will not start billing you until you have added at least 5 users to
            अvkash.
          </Text>
          {subscriptionId && subscriptionDetails && (
            <div style={{ marginTop: 16 }}>
              <Text strong style={{ color: "#ff4d4f", display: "block" }}>
                {subscriptionDetails.status === "cancelled"
                  ? "Your subscription expiry date: "
                  : "Next Due Date: "}
                {dayjs(subscriptionDetails.currentEnd * 1000).format(
                  "DD/MM/YYYY"
                )}
              </Text>
            </div>
          )}
        </Card>
      </Col>

      {userCount > 5 && (
        <Row style={{ marginTop: 16 }}>
          <Col span={24}>
            <Space
              direction="vertical"
              size="middle"
              style={{ display: "flex" }}
            >
              {subscriptionId && (
                <>
                  <Button
                    type="default"
                    onClick={() => setShowSubscriptionDetails((prev) => !prev)}
                  >
                    {showSubscriptionDetails
                      ? "Hide Subscription"
                      : "View Subscription"}
                  </Button>
                  <Button
                    type="default"
                    onClick={() => setShowInvoices((prev) => !prev)}
                  >
                    {showInvoices ? "Hide Invoices" : "View Invoices"}
                  </Button>
                </>
              )}
              <Button
                danger={subscriptionId ? true : false}
                loading={loading && !subscriptionId}
                onClick={
                  subscriptionId ? handleCancelSubscription : handlePurchase
                }
                disabled={
                  subscriptionDetails &&
                  subscriptionDetails.status === "cancelled"
                }
              >
                {subscriptionId ? "Cancel Subscription" : "Buy Subscription"}
              </Button>
              {showSubscriptionDetails && subscriptionDetails && (
                <Card
                  title="Subscription Details"
                  style={{
                    marginTop: 16,
                    backgroundColor: "#e6f7ff",
                    border: "1px solid #91d5ff",
                  }}
                >
                  <p>
                    <strong>Status:</strong> {subscriptionDetails.status}
                  </p>
                  <p>
                    <strong>No of Users:</strong> {subscriptionDetails.quantity}
                  </p>
                  <p>
                    <strong>Start Date:</strong>{" "}
                    {dayjs(subscriptionDetails.startAt * 1000).format(
                      "DD/MM/YYYY"
                    )}
                  </p>
                  <p>
                    <strong>Next Due Date:</strong>{" "}
                    {dayjs(subscriptionDetails.currentEnd * 1000).format(
                      "DD/MM/YYYY"
                    )}
                  </p>
                  <Button
                    type="link"
                    href={subscriptionDetails.shortUrl}
                    target="_blank"
                  >
                    View Subscription
                  </Button>
                </Card>
              )}
              {showInvoices && invoices.length > 0 && (
                <Space
                  direction="vertical"
                  size="middle"
                  style={{ display: "flex", marginTop: 16 }}
                >
                  {invoices.map((invoice) => (
                    <Card
                      key={invoice.id}
                      title={formatInvoiceTitle(invoice.issued_at)}
                      style={{
                        width: "100%",
                        border: "1px solid #d9d9d9",
                        backgroundColor: "#f5f5f5",
                        color: "#333",
                      }}
                      headStyle={{
                        backgroundColor: "#e6f7ff",
                        fontWeight: "bold",
                      }}
                    >
                      <p>
                        <strong>Amount:</strong> {invoice.gross_amount / 100}{" "}
                        INR
                      </p>
                      <p>
                        <strong>Status:</strong> {invoice.status}
                      </p>
                      <p>
                        <strong>Issued On:</strong>{" "}
                        {dayjs(invoice.issued_at * 1000).format("DD/MM/YYYY")}
                      </p>
                      <Button
                        type="link"
                        href={invoice.short_url}
                        target="_blank"
                      >
                        View Invoice
                      </Button>
                    </Card>
                  ))}
                </Space>
              )}
            </Space>
          </Col>
        </Row>
      )}
    </Row>
  );
};

export default SubscriptionButton;
