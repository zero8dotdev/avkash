import { Col, Row } from "antd";
import Title from "antd/es/typography/Title";
import UserList from "./_components/user-list";

const Page = async () => {
  return (
    <Row gutter={8}>
      <Col span={24}>
        <UserList />
      </Col>
    </Row>
  );
};

export default Page;
