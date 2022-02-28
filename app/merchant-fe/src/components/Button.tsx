import styled from "styled-components";
import { Theme } from "./Themes";

const Button = styled.button`
  background: ${({ theme }) => (theme as Theme).background};
  color: ${({ theme }) => (theme as Theme).componentText};
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0.6rem;
`;

export default Button;
