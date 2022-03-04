import React, { FC } from "react";
import { Link } from "react-router-dom";

const BackLink: FC<{ pathname: string; text: string }> = ({
  pathname,
  text,
}) => {
  return (
    <Link
      className="text-secondary-light dark:text-secondary-dark text-lg"
      to={{ pathname }}
    >
      {text}
    </Link>
  );
};

export default BackLink;
