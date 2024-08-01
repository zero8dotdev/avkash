import { Flex, List } from "antd";

import {
  type ILeavePolicyProps,
  LeavePolicy,
} from "../../dashboard/settings/_components/leave-policy";

export type LeavePolicyProps = {
  leavePoliciesData: ILeavePolicyProps[];
  update: (policies: ILeavePolicyProps[]) => void;
};

const LeavePolicies: React.FC<LeavePolicyProps> = ({
  leavePoliciesData,
  update: leavePolicyUpdate,
}) => {
  return (
  <Flex
    vertical
    style={{  height: "500px", width: "100%",overflow:'auto' }}

    >
    <List
      dataSource={leavePoliciesData}
      grid={{
        gutter: 24,
        column:3
      }}
      renderItem={(item, index) => (
        <Flex>
        <LeavePolicy
          {...leavePoliciesData[index]}
          update={(values) => {
            let copy = [...leavePoliciesData];
            copy[index] = { ...values };
            leavePolicyUpdate(copy);
          }}
        />
        </Flex>
      )}
    />
    </Flex>
  );
};

export default LeavePolicies;
