import React, { FC, ReactNode } from "react";

const Heading: FC<{ children: ReactNode }> = ({ children }) => (
  <h2 className="text-2xl font-bold leading-7 sm:text-3xl sm:truncate my-6">
    {children}
  </h2>
);

export default Heading;
