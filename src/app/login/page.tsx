import { Flex, Col, Typography } from "antd";
import {Title} from ''
import WithSlack from "./withSlack";

const { Title } = Typography;

export default function Login() {
  return (
    <Flex justify="center" align="center">
      <Col span={4} style={{ border: "1px solid #ccc" }}>
        <Title>Sign in to Avkash</Title>
        <WithSlack />
      </Col>
    </Flex>
  );
}
