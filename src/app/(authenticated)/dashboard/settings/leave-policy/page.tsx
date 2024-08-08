"use client";

import { fetchleaveTypes, updateLeavePolicies } from "@/app/_actions";
import { useApplicationContext } from "@/app/_context/appContext";
import { Button, Flex, List} from "antd";
import React, { useEffect, useState } from "react";
import { LeavePolicy } from "../_components/leave-policy";

const LeavePolicies = () => {
  const [leavePolicies, setLeavePolicies] = useState<any[]>([]);
  const [loader,setLoader]=useState<boolean>(false)
  const { state: appState } = useApplicationContext();

  const { orgId } = appState;

  const fetchLeaveTypesData = async (orgId: string) => {
    setLoader(true)
    try {
      const leaveTypes = fetchleaveTypes(orgId);
    
      const policies = (await leaveTypes).map((each) => {
        return {
          leaveTypeId: each.leaveTypeId,
          accrualFrequency: "Monthly",
          accrueOn: "End",
          rollOverLimit: 1,
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
      
      
    } catch (error) {
      console.error(error)
    }finally{
      setLoader(false)
    }
   
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
    <Flex vertical style={{ overflow: "auto", height: "500px" }}>
      <List
        dataSource={leavePolicies}
        loading={loader}
        
        renderItem={(item, index) => (
          <List.Item key={index}>
            <LeavePolicy
              {...leavePolicies[index]}
              update={(values) => {
                let copy = [ ...leavePolicies ];
                copy[index] = { ...values };
                setLeavePolicies(copy);
              }}
            />
          </List.Item>
        )}
      />
      {leavePolicies.length > 0 ? (
        <Button
          onClick={handleFormData}
          style={{ alignSelf: "end" }}
          type="primary"
        >
          Save
        </Button>
      ):null}
    </Flex>
  );
};

export default LeavePolicies;
