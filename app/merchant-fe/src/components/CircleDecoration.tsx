import React, { FC } from "react";

const CircleDecoration: FC<{ className: string }> = ({ className }) => (
  <span
    className={`ml-4 flex-shrink-0 flex items-center justify-center h-4 w-4 rounded-full ${className}`}
  ></span>
);

export default CircleDecoration;
