"use client";

import { Avatar, Button, Divider, Popover } from "antd";
import { createClient } from "@/app/_utils/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { revalidatePath } from "next/cache";

const supabase = createClient();

export default function LogoutButton() {
  const [user, setUser] = useState<any | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      // const { data } = await supabase.auth.getUser();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log(session);

      setUser(session?.user);
    })();
  }, []);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      revalidatePath("/", "layout");
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
        <Avatar size="large" src={user?.user_metadata?.avatar_url} />
      </Popover>
    );
  } else {
    return null;
  }
}
