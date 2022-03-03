import React, { FC, ReactNode } from "react";
import styled from "styled-components";
import { Theme } from "./Themes";

// const Button = styled.button`
//   background: ${({ theme }) => (theme as Theme).background};
//   color: ${({ theme }) => (theme as Theme).componentText};
//   border: none;
//   border-radius: 8px;
//   cursor: pointer;
//   font-size: 0.8rem;
//   padding: 0.6rem;
// `;

const Button: FC<{disabled?: boolean, onClick?: () => void, children: ReactNode}> = ({ onClick, children }) => (
  <button onClick={onClick} className="dark:text-btn-dark dark:hover:text-btn-hv-dark dark:bg-btn-bg-dark dark:hover:bg-btn-bg-hv-dark py-3 px-6 rounded-full">
    {children}
  </button>
)

export default Button;
