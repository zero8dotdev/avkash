'use client';

import { useEffect } from 'react';
import { useApplicationContext } from '@/app/_context/appContext';

const StoreToContext = ({
  user,
  org,
  team,
  teams,
}: {
  user: object;
  org: object;
  team: object;
  teams: Array<object>;
}) => {
  const { dispatch } = useApplicationContext();

  useEffect(() => {
    dispatch({ type: 'setOrg', payload: org });
    dispatch({ type: 'setTeam', payload: team });
    dispatch({ type: 'setUser', payload: user });
    dispatch({ type: 'setTeams', payload: teams });
  }, [org, team, user, teams]);

  return null;
};

export default StoreToContext;
