import { Flex, List } from "antd";
import Text from "antd/es/typography/Text";
import React, { useEffect } from "react";
import {
  ILeavePolicyProps,
  ILeavePolicyUpdate,
  LeavePolicy,
} from "../../dashboard/settings/leave-policy/page";

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
            console.log(JSON.stringify(copy, null, 2));
            copy[index] = { ...values };
            console.log(JSON.stringify(copy, null, 2));
            leavePolicyUpdate(copy);
          }}
        />
      )}
    />
  );
};

export default LeavePolicies;
