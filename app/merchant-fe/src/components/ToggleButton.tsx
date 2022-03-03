import React, {FC, useState} from "react";

const ToggleButton: FC<{ onChange: (checked: boolean) => void }> = ({ onChange }) => {
  const [checked, setChecked] = useState(false);
  const handleChange = (value: boolean) => {
    setChecked(value);
    onChange(value);
  }
  return (
    <label htmlFor="toggle-example" className="flex items-center cursor-pointer relative">
      <input type="checkbox" id="toggle-example" className="sr-only" checked={checked} onChange={e => handleChange(e.target.checked)} />
      <div className="toggle-bg bg-gray-200 border-2 border-gray-200 h-6 w-11 rounded-full"></div>
    </label>
  );
}

export default ToggleButton;
