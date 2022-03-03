import React, { FC, ReactNode, useState, useEffect, useMemo } from "react";
import { DarkMode, DarkModeContext } from "../hooks/useDarkMode";
import { darkTheme, lightTheme } from "../components/Themes";

const darkModeLocalKey = "darkMode";

export const DarkModeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState<DarkMode>("light");

  /*
    // On page load or when changing themes, best to add inline in `head` to avoid FOUC
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // Whenever the user explicitly chooses light mode
    localStorage.theme = 'light'

    // Whenever the user explicitly chooses dark mode
    localStorage.theme = 'dark'

    // Whenever the user explicitly chooses to respect the OS preference
    localStorage.removeItem('theme')
  */

  useEffect(() => {
    if (darkMode == "dark") {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
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
