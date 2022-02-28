import React, { FC, ReactNode, useState, useEffect, useMemo } from "react";
import { DarkMode, DarkModeContext } from "../hooks/useDarkMode";
import { darkTheme, lightTheme } from "../components/Themes";

const darkModeLocalKey = "darkMode";

export const DarkModeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState<DarkMode>("light");

  const setMode = (mode: DarkMode) => {
    window.localStorage.setItem(darkModeLocalKey, mode);
    setDarkMode(mode);
  };

  useEffect(() => {
    const localMode = window.localStorage.getItem(darkModeLocalKey) as DarkMode;
    localMode && setMode(localMode);
  }, []);

  const toggle = () => {
    darkMode === "light" ? setMode("dark") : setMode("light");
  };

  const theme = useMemo(() => {
    return darkMode === "dark" ? darkTheme : lightTheme;
  }, [darkMode]);

  return (
    <DarkModeContext.Provider value={{ theme, toggle }}>
      {children}
    </DarkModeContext.Provider>
  );
};
