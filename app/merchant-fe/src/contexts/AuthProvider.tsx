import React, { FC } from "react";
import { AuthContext } from "../hooks/useAuth";
import { loginProvider } from "../utils/login";

export const AuthProvider: FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = React.useState<Nullable<string>>(null);

  const login = (code: string) => {
    loginProvider.login(code).then((res) => setUser(res));
  };

  const value = { user, login };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
