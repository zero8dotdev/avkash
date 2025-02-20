"use client";

import { createContext, useContext, useReducer } from "react";

interface User {
  full_name: string;
  email: string;
  avatar_url: string;
  role: string;
  sub: string;
}

interface Team {
  teamId: string;
  name: string;
}
interface ContextState {
  orgId: string;
  org: { visibility: string; createdOn: any } | undefined;
  team: Team | undefined;
  teamId: string;
  userId: string;
  user: User | undefined;
  teams: Array<{ teamId: string; name: string }> | [];
  role: string;
}

type ActionTypes =
  | "setUserId"
  | "setOrgId"
  | "setTeamId"
  | "setUser"
  | "setRole"
  | "setOrg"
  | "setTeam"
  | "setTeams"
  | "logout";

interface Action {
  type: ActionTypes;
  payload: any;
}

const INITIAL_STATE: ContextState = {
  orgId: "",
  teamId: "",
  userId: "",
  role: "",
  team: undefined,
  org: undefined,
  user: undefined,
  teams: [],
};

interface ApplicationContextType {
  state: ContextState;
  dispatch: React.Dispatch<Action>;
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(
  undefined
);

function applicationReducer(state: ContextState, action: Action) {
  switch (action.type) {
    case "setOrgId":
      return {
        ...state,
        orgId: action.payload,
      };

    case "setOrg":
      return {
        ...state,
        orgId: action?.payload?.orgId,
        org: action.payload,
      };
    case "setRole":
      return {
        ...state,
        role: action.payload
      };

    case "setTeamId":
      return {
        ...state,
        teamId: action.payload,
      };

    case "setTeam":
      return {
        ...state,
        teamId: action?.payload?.teamId,
        team: action.payload,
      };

    case "setTeams":
      return {
        ...state,
        teams: action.payload,
      };

    case "setUserId":
      return {
        ...state,
        userId: action.payload,
      };
    case "setUser":
      return {
        ...state,
        userId: action?.payload?.userId,
        user: action.payload,
      };
    case "logout":
      return {
        ...state,
        ...INITIAL_STATE,
      };
    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
}

function ApplicationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(applicationReducer, INITIAL_STATE);

  const value = { state, dispatch };

  return (
    <ApplicationContext.Provider value={value}>
      {children}
    </ApplicationContext.Provider>
  );
}

function useApplicationContext(): ApplicationContextType {
  const context = useContext(ApplicationContext);

  if (context === undefined) {
    throw new Error(
      "useApplicationContext must be used within a ApplicationProvider"
    );
  }

  return context as ApplicationContextType;
}

export { ApplicationProvider, useApplicationContext };
