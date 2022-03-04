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

interface props {
  small?: boolean,
  disabled?: boolean, 
  onClick?: () => void, 
  children?: ReactNode
}

const Button: FC<props> = ({ small, disabled, onClick, children }) => {
  const className = small ? "py-2 px-4" : "py-3 px-6";
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`dark:text-btn-dark dark:hover:text-btn-hv-dark dark:bg-btn-bg-dark rounded-full whitespace-nowrap ${className}`}
    >
      {children}
    </button>
  );
}

export default Button;
