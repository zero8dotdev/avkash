import { Flex, Col } from "antd";
import WithSlack from "./withSlack";

export default function Login() {
  return (
    <Flex justify="center" align="center" style={{ height: "500px" }}>
      <Col span={4}>
        <WithSlack />
      </Col>
    </Flex>
  );
}
