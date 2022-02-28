import { createGlobalStyle } from "styled-components";
import { Theme } from "./Themes";

export const GlobalStyles = createGlobalStyle`
  body {
    background: ${({ theme }) => (theme as Theme).body};
    color: ${({ theme }) => (theme as Theme).text};
    font-family: Tahoma, Helvetica, Arial, Roboto, sans-serif;
    transition: all 0.50s linear;
  }
`;
