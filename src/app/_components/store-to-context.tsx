"use client";
import { useEffect } from "react";
import { useApplicationContext } from "../_context/appContext";

const StoreToContext = ({
  user,
  org,
  team,
}: {
  user: object;
  org: object;
  team: object;
}) => {
  const { dispatch } = useApplicationContext();

  useEffect(() => {
    dispatch({ type: "setOrg", payload: org });
    dispatch({ type: "setTeam", payload: team });
    dispatch({ type: "setUser", payload: user });
  }, [org, team, user]);

  return null;
};

export default StoreToContext;
