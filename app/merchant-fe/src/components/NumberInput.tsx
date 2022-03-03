import React, {FC} from "react";

const NumberInput: FC<{label?: string}> = ({ label }) => {
  return (
    <div>
      <label htmlFor="price" className="block text-sm font-medium dark:text-secondary-dark pl-3">
        {label}
      </label>
      <div className="mt-1 relative rounded-full shadow-sm">
        {/* <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-500 sm:text-sm">$</span>
        </div> */}
        <input
          type="text"
          name="price"
          id="price"
          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-full dark:bg-input-bg-dark dark:hover:bg-input-bg-hv-dark dark:text-primary-dark dark:placeholder:text-primary-dark"
          placeholder="0.00"
        />
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
      </div>
    </div>
  );
}

export default NumberInput;
