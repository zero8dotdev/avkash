"use client";

import { Avatar, Button, Divider, Popover } from "antd";
import { createClient } from "@/app/_utils/supabase/client";
import { useEffect, useState } from "react";
import { useApplicationContext } from "@/app/_context/appContext";
import { logoutAction } from "./actions";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserRole } from "@/app/(authenticated)/dashboard/timeline/_actions";

export default function LogoutButton() {
  const supabase = createClient();
  const { state, dispatch } = useApplicationContext();
  const { user } = state;

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      let role = null;
      if (data?.user?.id) {
        role = await getUserRole(data.user.id);
      }
      if (data?.user) {
        dispatch({ type: "setUser", payload: data.user.user_metadata });
        dispatch({ type: "setUserId", payload: data.user.id });
        dispatch({type:"setRole", payload:role })
      }
    })();
  }, []);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      logoutAction();
      dispatch({ type: "logout", payload: null });
      redirect("/");
    } catch (error) {
      console.log("Error while logging out ", error);
    }
  };

  if (user) {
    const popoverContent = (
      <div style={{ width: "200px" }}>
        <div style={{ marginBottom: "5px" }}>
          <p style={{ margin: 0, padding: 0 }}>{user?.full_name}</p>
          <p
            style={{
              margin: 0,
              padding: 0,
              lineHeight: "0.9rem",
              fontSize: "0.9rem",
              color: "#ccc",
            }}
          >
            {user?.email}
          </p>
        </div>
        <Divider style={{ margin: 0, padding: 0 }} />
        <Button
          type="link"
          danger
          block
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            logout();
          }}
        >
          Logout
        </Button>
      </div>
    );

    return (
      <Popover content={popoverContent} placement="bottomLeft">
        <Avatar size="large" src={user?.avatar_url} />
      </Popover>
    );
  } else {
    return (
      <Link
        href="/login"
        className="inline-flex items-center justify-center rounded-full py-2 px-4 text-sm  focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 bg-slate-900 text-white hover:bg-slate-700 hover:text-slate-100 active:bg-slate-800 active:text-slate-300 focus-visible:outline-slate-900"
      >
        Add to Slack
      </Link>
    );
  }
}
