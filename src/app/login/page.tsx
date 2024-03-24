"use client";

import { redirect, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function Login() {
  const searchParams = useSearchParams();

  // authorization_code

  useEffect(() => {
    if (searchParams.has("code")) {
      const code = searchParams.get("code");
      const sampleSlackObj = {
        code: code,
        grant_type: "authorization_code",
        client_id: process.env.NEXT_PUBLIC_SLACK_CLIENT_ID,
        client_secret: process.env.NEXT_PUBLIC_SLACK_CLIENT_SECRET,
        redirect_uri: "https://localhost:3000/login",
      };

      fetch("https://slack.com/api/openid.connect.token", {
        method: "POST",
        body: JSON.stringify(sampleSlackObj),
        headers: {
          Accept: "application/json",
        },
      })
        .then((res) => res.json())
        .then((response) => {
          console.log(response);
        });
    }
  }, [searchParams]);

  return (
    <div className="flex  justify-center items-center min-h-screen">
      <div className="text-center space-x-3">
        <h1 className="font-bold">Sign in to Avkash</h1>
        <a
          href="https://slack.com/openid/connect/authorize?scope=openid%20email%20profile&amp;response_type=code&amp;redirect_uri=https%3A%2F%2Flocalhost:3000%2Flogin&amp;client_id=6356258938273.6852130512611"
          className="w-72 rounded-md m-4 p-1 bg-pink-700"
        >
          Sign in with Slack
        </a>
        <br />
        <button className="w-72 rounded-md p-1 bg-green-800">
          Sign in with Email
        </button>
      </div>
    </div>
  );
}
