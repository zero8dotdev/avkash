'use server';

import { createClient } from "@/app/_utils/supabase/server";
import { createAdminClient } from "@/app/_utils/supabase/adminClient";

export const completeSetup = async (orgId: string, setupData: any) => {
    try {
      const {
        startOfWorkWeek,
        workweek,
        timeZone,
        leaveChange: notificationLeaveChanged,
        dailySummary: notificationDailySummary,
        weeklySummary: notificationWeeklySummary,
        sendNtf: notificationToWhom,
        leavePolicies,
        holidaysList,
        countryCode,
        users,
        teamId
      } = setupData;
  
      const supabaseServerClient = createClient();
      const { data: { user: currentUser }, error } = await supabaseServerClient.auth.getUser();
  
      const supabaseAdminClient = createAdminClient();
  
      const { data: organisation, error: orgError } = await supabaseAdminClient
        .from('Organisation')
        .update({
          startOfWorkWeek,
          workweek,
          notificationLeaveChanged,
          notificationDailySummary,
          notificationWeeklySummary,
          // notificationToWhom: Array.isArray(notificationToWhom) && notificationToWhom[0]
        })
        .eq('orgId', orgId)
        .select('*');
  
      if (orgError) {
        throw orgError;
      }
  
      // leavePolicies
      const { data: leavePoliciesData, error: leavePoliciesError } = await supabaseAdminClient
        .from('LeavePolicy')
        .insert(leavePolicies.map((policy: any) => ({ ...policy, orgId })))
        .select('*');
  
      if (leavePoliciesError) {
        throw leavePoliciesError;
      }
  
      // holidays
      const { data: holidaysData, error: holidaysError } = await supabaseAdminClient
        .from('Holiday')
        .insert(
          holidaysList
            .map(({
              name,
              isRecurring,
              isCustom,
              date
            }: any) => ({
              name,
              isRecurring,
              isCustom,
              orgId,
              date,
              createdBy: currentUser?.id,
              location: countryCode
            })))
        .select();
  
      if (holidaysError) {
        throw holidaysError;
      }
  
  
      let accruedLeave = leavePoliciesData
        .filter(({ isActive }) => isActive)
        .reduce((acc, leavePolicy) => {
          acc[leavePolicy.leaveTypeId] = { balance: leavePolicy.unlimited ? 'unlimited' : leavePolicy.maxLeaves }
          return acc;
        }, {});
  
      let usedLeave = leavePoliciesData
        .filter(({ isActive }) => isActive)
        .reduce((acc, leavePolicy) => {
          acc[leavePolicy.leaveTypeId] = { balance: leavePolicy.unlimited ? 'unlimited' : 0 }
          return acc;
        }, {});
  
      const acc = { loggedInUser: {}, users: [] };
      const { loggedInUser, users: restUsers } = users
        .reduce((acc: any, { slackId, name, email, isProrate }: any) => {
          if (slackId === currentUser?.user_metadata.sub) {
            acc.loggedInUser = {
              id: currentUser?.id,
              slackId,
              orgId,
              accruedLeave,
              usedLeave
            }
          } else {
            acc.users.push({
              slackId,
              name,
              email,
              orgId,
              accruedLeave,
              usedLeave,
              teamId,
              createdBy: currentUser?.id
            });
          }
          return acc;
        }, acc);
  
  
      const { data: userData, error: userError } = await supabaseAdminClient
        .from('User')
        .update({
          slackId: loggedInUser.slackId,
          accruedLeave: loggedInUser.accruedLeave,
          usedLeave: loggedInUser.usedLeave
        })
        .eq('userId', loggedInUser.id)
        .select();
  
      if (userError) {
        throw userError;
      }
  
      const { data: usersData, error: usersError } = await supabaseAdminClient
        .from('User')
        .insert(restUsers)
        .select('*');
  
      if (usersError) {
        throw usersError;
      }
  
  
      const result = await supabaseAdminClient
        .from('Organisation')
        .update({ "initialSetup": true })
        .eq('orgId', orgId)
        .select();
  
      if (result.error) {
        throw result.error
      }
      return true;
  
    } catch (error) {
      console.log(error);
      throw error
    }
  };