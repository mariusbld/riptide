import React, { FC, useRef } from "react";
import { uniqueId } from "../utils/unique";

interface props {
  label?: string;
  suffix?: string;
  value?: number;
  onChange?: (val: number) => void;
  integer?: boolean;
}

const NumberInput: FC<props> = ({
  label,
  suffix,
  value,
  onChange,
  integer,
}) => {
  const { current: inputId } = useRef(uniqueId());
  const handleChange = (strVal: string) => {
    let val: number = 0;
    if (integer) {
      val = parseInt(strVal);
    } else {
      val = parseFloat(strVal);
    }
    onChange && onChange(val);
  };
  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium dark:text-secondary-dark pl-3"
        >
          {label}
        </label>
      )}
      <div className="mt-1 relative rounded-full shadow-sm">
        {/* <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-500 sm:text-sm">$</span>
        </div> */}
        <input
          type="number"
          name={`number-${inputId}`}
          min={0}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          id={inputId}
          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-full dark:bg-input-bg-dark dark:hover:bg-input-bg-hv-dark dark:text-primary-dark dark:placeholder:text-primary-dark"
          placeholder={integer ? "0" : "0.00"}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none">
            <span className="dark:text-primary-dark sm:text-sm pr-3">USDC</span>
            {/* <label htmlFor="currency" className="sr-only">
            Currency
          </label>
          <select
            id="currency"
            name="currency"
            className="focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-gray-500 sm:text-sm rounded-md"
          >
            <option>USD</option>
            <option>CAD</option>
            <option>EUR</option>
          </select> */}
          </div>
        )}
      </div>
    </div>
  );
};

export default NumberInput;
