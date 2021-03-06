/* This example requires Tailwind CSS v2.0+ */
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/solid";
import React, { FC, Fragment, ReactNode } from "react";
import SelectedArrow from "./svg/SelectedArrow";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

interface itemProps {
  children?: ReactNode;
  href?: string;
  onClick?: () => void;
  isSelected?: boolean;
}

export const DropdownItem: FC<itemProps> = ({
  children,
  href,
  onClick,
  isSelected,
}) => {
  return (
    <Menu.Item>
      {({ active }) => (
        <a
          href={href ?? "#"}
          onClick={onClick}
          target={href ? "_blank" : undefined}
          className={classNames(
            active ? "bg-gray-100 text-gray-900" : "text-gray-700",
            isSelected ? "font-semibold" : "",
            "block px-4 py-2 text-sm"
          )}
        >
          <span>
            {isSelected && <SelectedArrow />}
            {children}
          </span>
        </a>
      )}
    </Menu.Item>
  );
};

interface props {
  disabled?: boolean;
  label?: string;
  transparent?: boolean;
  children?: ReactNode;
}

const Dropdown: FC<props> = ({ disabled, label, transparent, children }) => {
  const labelClassName = transparent
    ? "bg-transparent"
    : "border border-gray-300 shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500";
  const labelTextColor = disabled ? "text-zinc-400 dark:text-zinc-600" : "";
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button
          disabled={disabled}
          className={`inline-flex justify-center w-full rounded-md px-4 py-2 text-md font-medium whitespace-nowrap ${labelClassName} ${labelTextColor}`}
        >
          {label ?? "Options"}
          <ChevronDownIcon className="-mr-1 ml-2 h-6 w-6" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">{children}</div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default Dropdown;
