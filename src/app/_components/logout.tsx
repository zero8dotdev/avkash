"use client";

import { Avatar, Button, Divider, Popover } from "antd";
import { createClient } from "../_utils/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { revalidatePath } from "next/cache";
import { useApplicationContext } from "../_context/appContext";
const supabase = createClient();

export default function LogoutButton() {
  const { state, dispatch } = useApplicationContext();
  const { user } = state;
  const router = useRouter();
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      console.log("Here", data);
      if (data?.user) {
        dispatch({ type: "setUser", payload: data.user });
      }
    })();
  }, []);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      // revalidatePath("/", "layout");
      dispatch({ type: "setUser", payload: null });
      router.push('/login')
    } catch (error) {
      console.log("Error while logging out ", error);
    }
  };

  if (user) {
    const popoverContent = (
      <div style={{ width: "200px" }}>
        <div style={{ marginBottom: "5px" }}>
          <p style={{ margin: 0, padding: 0 }}>
            {user?.user_metadata?.full_name}
          </p>
          <p
            style={{
              margin: 0,
              padding: 0,
              lineHeight: "0.9rem",
              fontSize: "0.9rem",
              color: "#ccc",
            }}
          >
            {user?.user_metadata?.email}
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
        <Avatar size="large" src={user?.user_metadata?.avatar_url } />
      </Popover>
    );
  } else {
    return ;
  }
}
