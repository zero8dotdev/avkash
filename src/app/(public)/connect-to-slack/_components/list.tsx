"use client";

import { createClient } from "@/app/_utils/supabase/client";
import { Avatar, Button, Flex, List } from "antd";
import { useEffect, useState } from "react";

const OrgList = ({
  organisations,
  serverAction,
}: {
  organisations: any[];
  serverAction: Function;
}) => {
  const [users, setUsers] = useState<any[] | null>();

  useEffect(() => {
    (async () => {
      const client = createClient();
      const { data: users } = await client.from("User").select();
      setUsers(users);
    })();
  }, []);

  const clientAction = async () => {
  };

  const serverActionHandler = async () => {
    const newUsers = await serverAction("SriHari");
    Array.isArray(users)
      ? setUsers([...users, ...newUsers])
      : setUsers(newUsers);
  };

  return (
    <>
      <List
        dataSource={organisations}
        bordered
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              avatar={<Avatar src={""} />}
              title={<a href="#">{item.name}</a>}
              description={item.visibility}
            />
          </List.Item>
        )}
      />
      <div style={{ marginTop: "10px" }}>
        {users ? (
          <List
            dataSource={users}
            bordered
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar src={""} />}
                  title={<a href="#">{item.name}</a>}
                  description={item.visibility}
                />
              </List.Item>
            )}
          />
        ) : null}
      </div>
      <Flex style={{ marginTop: "10px" }} justify="center" align="center">
        <Button.Group>
          <Button block type="primary" onClick={clientAction}>
            Action from Client
          </Button>
          <Button block type="primary" onClick={serverActionHandler}>
            Action from Server
          </Button>
        </Button.Group>
      </Flex>
    </>
  );
};

export default OrgList;
