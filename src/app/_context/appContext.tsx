"use client";

import { createContext, useContext, useReducer } from "react";

interface User {
  full_name: string;
  email: string;
  avatar_url : string
}

interface ContextState {
  orgId: string;
  teamId: string;
  userId: string;
  user: User | undefined | null
}

type ActionTypes = "setUserId" | "setOrgId" | "setTeamId" | "setUser";

interface Action {
  type: ActionTypes;
  payload: any;
}

const INITIAL_STATE: ContextState = {
  orgId: "",
  teamId: "",
  userId: "",
  user: {
      full_name : '',
      email: '',
      avatar_url: 'https://www.shutterstock.com/image-vector/user-login-authenticate-icon-human-260nw-1365533969.jpg'
  }
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
    case "setUser":
      return {
        ...state,
        user: action.payload,
      };

    case "setUser":
      return {
        ...state,
        user: action.payload,
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
