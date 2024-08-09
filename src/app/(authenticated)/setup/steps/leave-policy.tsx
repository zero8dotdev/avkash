import { Flex, List } from "antd";

import { LeavePolicy } from "../../dashboard/settings/_components/leave-policy";

const LeavePolicies: React.FC<{
  leavePoliciesData: ILeavePolicy[];
  update: (policies: ILeavePolicy[]) => void;
}> = ({ leavePoliciesData, update: leavePolicyUpdate }) => {
  return (
    <Flex vertical style={{ width: "100%", overflow: "auto" }}>
      <List
        dataSource={leavePoliciesData}
        renderItem={(item, index) => (
          <LeavePolicy
            {...leavePoliciesData[index]}
            update={(values) => {
              let copy = [...leavePoliciesData];
              copy[index] = { ...values };
              leavePolicyUpdate(copy);
            }}
          />
        )}
      />
    </Flex>
  );
};

export default LeavePolicies;
