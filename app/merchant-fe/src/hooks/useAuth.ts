import React, { useContext, createContext } from "react";

export interface AuthContextState {
  user: Nullable<string>;
  login: (code: string) => void;
}

export const AuthContext = createContext<AuthContextState>(
  {} as AuthContextState
);

export const useAuth = () => {
  return useContext(AuthContext);
};
