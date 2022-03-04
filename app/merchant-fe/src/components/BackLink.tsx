import React, { FC, ReactNode } from "react";
import { Link } from "react-router-dom";

const BackLink: FC<{ pathname: string; children: ReactNode }> = ({
  pathname,
  children,
}) => {
  return (
    <Link
      className="text-secondary-light dark:text-secondary-dark text-lg"
      to={{ pathname }}
    >
      {children}
    </Link>
  );
};

export default BackLink;
