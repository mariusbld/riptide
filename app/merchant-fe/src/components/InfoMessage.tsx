import {
  CheckCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/outline";
import React, { FC, ReactNode } from "react";

export enum MessageIcon {
  None,
  Check,
  Info,
}

const InfoMessage: FC<{ icon?: MessageIcon; children?: ReactNode }> = ({
  icon,
  children,
}) => (
  <div className="flex flex-row">
    <span>
      {icon === MessageIcon.Info && (
        <InformationCircleIcon className="h-6 w-6" />
      )}
      {(!icon || icon === MessageIcon.Check) && (
        <CheckCircleIcon className="h-6 w-6" />
      )}
    </span>
    <span className="px-1">{children}</span>
  </div>
);

export default InfoMessage;
