"use client";

import { fetchleaveTypes, updateLeavePolicies } from "@/app/_actions";
import { useApplicationContext } from "@/app/_context/appContext";
import { Button, Flex, List } from "antd";
import React, { useEffect, useState } from "react";
import { LeavePolicy } from "../_components/leave-policy";

const LeavePolicies = () => {
  const [leavePolicies, setLeavePolicies] = useState<any[]>([]);
  const { state: appState } = useApplicationContext();
  const { orgId } = appState;

  const fetchLeaveTypesData = async (orgId: string) => {
    const leaveTypes = fetchleaveTypes(orgId);
    const policies = (await leaveTypes).map((each) => {
      return {
        leaveTypeId: each.leaveTypeId,
        accrualFrequency: null,
        accrueOn: null,
        rollOverLimit: null,
        rollOverExpiry: null,
        name: each.name,
        isActive: true,
        accruals: false,
        maxLeaves: 10,
        autoApprove: false,
        rollOver: false,
        unlimited: false,
      };
    });
    setLeavePolicies(policies);
  };

  useEffect(() => {
    fetchLeaveTypesData(orgId);
  }, [orgId]);

  const updateOrInsertLeavePolicies = async (each: any) => {
    const newValues = {
      isActive: each.isActive,
      accruals: each.accurals,
      maxLeaves: each.maxLeaves,
      autoApprove: each.autoApprove,
      rollOver: each.rollOver,
      accrualFrequency: each.accrualFrequency,
      accrueOn: each.accrueOn,
      rollOverLimit: each.ollOverLimit,
      rollOverExpiry: each.rollOverExpiry,
      unlimited: each.unlimited,
    };
    return await updateLeavePolicies(newValues, each.leaveTypeId, orgId);
  };

  const handleFormData = async () => {
    await Promise.all(
      leavePolicies.map(async (each) => {
        return await updateOrInsertLeavePolicies(each);
      })
    );
  };

  return (
    <Flex
      vertical
      style={{ overflow: "scroll", height: "500px", width: "100%" }}
    >
      <List
        dataSource={leavePolicies}
        grid={{
          gutter: 24,
        }}
        renderItem={(item, index) => (
          <List.Item key={index}>
            <LeavePolicy
              {...leavePolicies[index]}
              update={(values) => {
                let copy = { ...leavePolicies };
                copy[index] = { ...values };
                setLeavePolicies([...copy]);
              }}
            />
          </List.Item>
        )}
      />
      <Button
        onClick={handleFormData}
        style={{ alignSelf: "end" }}
        type="primary"
      >
        Save
      </Button>
    </Flex>
  );
};

export default LeavePolicies;
