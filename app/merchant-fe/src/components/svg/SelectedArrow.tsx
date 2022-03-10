import React from "react";

const SelectedArrow = () => {
  return (
    <svg
      className="h-4 w-4 text-black inline-block"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      stroke-width="2"
      stroke="currentColor"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      {" "}
      <path stroke="none" d="M0 0h24v24H0z" />{" "}
      <polyline points="7 7 12 12 7 17" />{" "}
      <polyline points="13 7 18 12 13 17" />
    </svg>
  );
};

export default SelectedArrow;
