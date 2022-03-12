import React, { FC, ReactNode } from "react";
import Spinner from "./Spinner";

interface props {
  small?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children?: ReactNode;
  loading?: boolean;
}

const Button: FC<props> = ({
  small,
  destructive,
  disabled,
  onClick,
  children,
  loading,
}) => {
  let className = small ? "py-2 px-4" : "py-3 px-6";
  className += disabled
    ? " bg-input-bg-light dark:bg-input-bg-dark"
    : destructive
    ? " bg-btn-destr-bg-light dark:bg-btn-destr-bg-dark"
    : " bg-btn-bg-light dark:bg-btn-bg-dark";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={` text-btn-light hover:text-btn-hv-light dark:text-btn-dark dark:hover:text-btn-hv-dark rounded-full whitespace-nowrap ${className}`}
    >
      {children}
      {loading && <Spinner />}
    </button>
  );
};

export default Button;
