import { Button, Col, List, Row, Select } from "antd";
import Title from "antd/es/typography/Title";
import Search from "antd/es/input/Search";
import UserList from "./_components/user-list";
import { createClient } from "@/app/_utils/supabase/server";
import { fetchTeamMembers } from "@/app/_actions";

const Page = async () => {
  return (
    <Row gutter={8}>
      <Col span={24}>
        <Title>Users</Title>
      </Col>
      <Col span={24}>
        <UserList users={[]} />
      </Col>
    </Row>
  );
};

export default Page;
