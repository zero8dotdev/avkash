'use server';

import { createClient } from "../_utils/supabase/server";

export const fetchUser = async () => {
  try {
    const supabase = createClient();
    // TODO: figure out if we can skip this step.
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      throw error;
    }

    const { data: userProfile, error: userProfileError } = await supabase
      .from('User')
      .select()
      .eq('userId', user.id)
      .single();

    if (userProfileError || !userProfile) {
      throw userProfileError;
    }

    return userProfile;
  } catch (error) {
    console.log(error);
  }
};

// visibility is org visibility
export const fetchOrg = async (orgId: string) => {
  try {
    const supabase = createClient();

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
    const supabase = createClient();

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
