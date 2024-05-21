"use client";

import { createContext, useContext, useReducer } from "react";

interface ContextState {
  orgId: string;
  teamId: string;
  userId: string;
}

type ActionTypes = "setUserId" | "setOrgId" | "setTeamId";

interface Action {
  type: ActionTypes;
  payload: any;
}

const INITIAL_STATE: ContextState = {
  orgId: "",
  teamId: "",
  userId: "",
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

    case "setTeamId":
      return {
        ...state,
        teamId: action.payload,
      };

    case "setUserId":
      return {
        ...state,
        userId: action.payload,
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
