import React, { useEffect, useState } from "react";

export type darkModeType = "dark" | "light";
export type toggleDarkModeType = () => void;

const themeLocalKey = "theme";

export const useDarkMode = (): [darkModeType, toggleDarkModeType] => {
  const [theme, setTheme] = useState<darkModeType>("dark");

  const setMode = (mode: darkModeType) => {
    window.localStorage.setItem(themeLocalKey, mode);
    setTheme(mode);
  };

  const themeToggler = () => {
    theme === "light" ? setMode("dark") : setMode("light");
  };

  useEffect(() => {
    const localTheme = window.localStorage.getItem(
      themeLocalKey
    ) as darkModeType;
    localTheme && setTheme(localTheme);
  }, []);

  return [theme, themeToggler];
};
