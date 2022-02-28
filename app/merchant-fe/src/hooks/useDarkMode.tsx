import React, { createContext, useContext } from "react";
import { Theme, lightTheme } from "../components/Themes";

export type DarkMode = "light" | "dark";

export interface DarkModeContextState {
  toggle: () => void;
  theme: Theme;
}

const defaultDarkMode: DarkModeContextState = {
  theme: lightTheme,
  toggle: () => {},
};

export const DarkModeContext = createContext(defaultDarkMode);

export function useDarkMode(): DarkModeContextState {
  return useContext(DarkModeContext);
}
