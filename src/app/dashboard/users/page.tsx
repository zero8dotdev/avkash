import { Button, Col, List, Row, Select } from "antd";
import Title from "antd/es/typography/Title";
import Search from "antd/es/input/Search";
import UserList from "./_components/user-list";

const Page = async () => {
  return (
    <Row gutter={8}>
      <Col span={24}>
        <Title>Users</Title>
      </Col>
      <Col span={24}>
        <Select options={[{ label: "Team 1", value: "1" }]}></Select>
        <Search />
        <Button type="default">Download Report</Button>
        <Button type="primary">Invite Users</Button>
        <UserList users={[]} />
      </Col>
    </Row>
  );
};

export default Page;
