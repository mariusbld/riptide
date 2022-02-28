import React, {FC} from "react";
import { ThemeProvider as StyledThemeProvider } from "styled-components";
import { useDarkMode } from "../hooks/useDarkMode";

export const ThemeProvider: FC = ({ children }) => {
  const { theme } = useDarkMode();
  return (
    <StyledThemeProvider theme={theme}>
      {children}
    </StyledThemeProvider>
  );
}
