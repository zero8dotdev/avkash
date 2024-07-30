import { List } from "antd";

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
  );
};

export default LeavePolicies;
