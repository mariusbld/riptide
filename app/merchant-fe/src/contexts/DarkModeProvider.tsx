import React, { FC, ReactNode, useEffect, useMemo, useState } from "react";
import { darkTheme, lightTheme } from "../components/Themes";
import { DarkMode, DarkModeContext } from "../hooks/useDarkMode";

const darkModeLocalKey = "darkMode";

export const DarkModeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState<DarkMode>("light");

  useEffect(() => {
    if (darkMode == "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

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
