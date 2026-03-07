'use server';

import { createAdminClient } from '@/app/_utils/supabase/adminClient';
import { createClient } from '@/app/_utils/supabase/server';
import { WebClient } from '@slack/web-api';

export const updataOrgGeneralData = async (values: any, orgId: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('Organisation')
    .update({
      ...values,
    })
    .eq('orgId', orgId)
    .select();
  if (error) {
    throw error;
  }
  return data;
};

export const fetchOrgGeneralData = async (orgId: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('Organisation')
    .select('*')
    .eq('orgId', orgId)
    .single();
  if (error) {
    throw error;
  }
  return data;
};

export const fetchOrgleaveTypes = async (orgId: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('LeaveType')
    .select('*')
    .eq('orgId', orgId);

  if (error) {
    throw error;
  }

  return data;
};

export const updateLeaveTypeBasedOnOrg = async (
  isActive: boolean,
  orgId: string,
  leaveTypeId: any
) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('LeaveType')
    .update({ isActive })
    .eq('orgId', orgId)
    .eq('leaveTypeId', leaveTypeId)
    .select();
  if (error) {
    throw error;
  }
  return data;
};

export const updateLeaveType = async (values: any, leaveTypeId: any) => {
  const supabase = await createClient();
  const { color } = values;
  const leaveTypeValues = { ...values, color: color.slice(1) };

  const { data, error } = await supabase
    .from('LeaveType')
    .update(leaveTypeValues)
    .eq('leaveTypeId', leaveTypeId)
    .select();
  if (error) {
    throw error;
  }
  return data;
};

export const insertNewLeaveType = async (values: any) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('LeaveType')
    .insert(values)
    .select();
  if (error) {
    throw error;
  }
  return data;
};

export const fetchAllTeams = async (orgId: string) => {
  try {
    const supabase = await createClient();

    const { data: teams, error } = await supabase
      .from('Team')
      .select()
      .eq('orgId', orgId);

    if (error) {
      throw error;
    }

    return teams;
  } catch (error) {
    console.log(error);
  }
};

export const fetchTeamUsers = async (teamId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('User')
    .select('name')
    .eq('teamId', teamId);
  if (error) {
    console.log(error);
  }
  return data;
};

export const fetchOrg = async (orgId: string) => {
  try {
    const supabase = await createClient();

    const { data: organisation, error } = await supabase
      .from('Organisation')
      .select()
      .eq('orgId', orgId)
      .single();

    if (error || !organisation) {
      throw error;
    }

    return organisation;
  } catch (error) {
    console.log(error);
  }
};

export const fetchTeam = async (teamId: string) => {
  try {
    const supabase = await createClient();

    const { data: team, error } = await supabase
      .from('Team')
      .select()
      .eq('teamId', teamId)
      .single();

    if (error || !team) {
      throw error;
    }

    return team;
  } catch (error) {
    console.log(error);
  }
};

export const fetchPublicHolidays = async (countryCode: any) => {
  const currentYear = new Date().getFullYear();
  const supabase = await createClient();
  const { data: holidaysdata, error } = await supabase
    .from('PublicHolidays')
    .select('*')
    .eq('iso', countryCode)
    .eq('year', currentYear);

  if (error) {
    throw error;
  }
  return holidaysdata;
};

export const updateHolidaysList = async (
  holidaysList: any,
  orgId: string,
  countryCode: any
) => {
  const holidayData = holidaysList.map((e: any) => {
    return {
      name: e.name,
      date: e.date,
      isRecurring: e.isRecurring,
      isCustom: e.isCustom,
      location: countryCode,
      orgId,
    };
  });
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from('Holiday')
    .delete()
    .eq('orgId', orgId)
    .eq('location', countryCode);

  if (deleteError) {
    console.error('Error deleting existing holidays:', deleteError);
    throw deleteError;
  }

  const { data, error } = await supabase
    .from('Holiday')
    .insert(holidayData)
    .select();
  if (error) {
    console.log(error);
  }
  return data;
};

export const updateOrgLocations = async (
  locations: any,
  selectedCountryCode: any,
  orgId: string,
  teamId?: string
) => {
  const supabase = await createClient();
  const updatedLocations = Array.from(
    new Set([...locations, selectedCountryCode])
  );

  const { data, error } = await supabase
    .from('Organisation')
    .update({ location: updatedLocations })
    .eq('orgId', orgId)
    .select();

  if (error) {
    throw error;
  }

  const { data: team, error: teamerror } = await supabase
    .from('Team')
    .update({ location: selectedCountryCode })
    .eq('teamId', teamId)
    .select();

  return data;
};

export const deleteOrgLocations = async (
  locations: any,
  selectedCountryCode: any,
  orgId: string
) => {
  const supabase = await createClient();
  const { data: orgLocations, error: orgLocationsError } = await supabase
    .from('Organisation')
    .update({ location: [...locations] })
    .eq('orgId', orgId)
    .select();

  if (orgLocationsError) {
    throw orgLocationsError;
  }

  const response = await supabase
    .from('Holiday')
    .delete()
    .eq('orgId', orgId)
    .eq('location', selectedCountryCode);

  return orgLocations;
};

export const fetchTeamsData = async (orgId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('Team')
    .select(`*, User(*)`)
    .eq('orgId', orgId);

  if (error) {
    throw error;
  }

  const processedData = data.map((team) => {
    const teamId = team.teamId;
    const name = team.name;
    const status = team.isActive;
    const users = team.User.length;

    // Get the names of all managers
    const managerIds = team.managers || [];
    const managers = managerIds
      .map((managerId: string) => {
        const manager = team.User.find(
          (user: any) => user.userId === managerId
        );
        return manager ? manager.name : null;
      })
      .filter((managerName: string | null) => managerName !== null); // Filter out null values

    return {
      teamId,
      name,
      managers,
      users,
      status,
    };
  });

  return processedData;
};

export const updateTeamData = async (isActive: boolean, teamId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('Team')
    .update({ isActive })
    .eq('teamId', teamId)
    .select();
  if (error) {
    throw error;
  }
  return data;
};

export const fetchOrgHolidays = async (orgId: string, countryCode: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('Holiday')
    .select('*')
    .eq('orgId', orgId)
    .eq('location', countryCode);

  if (error) {
    throw error;
  }
  return data;
};
