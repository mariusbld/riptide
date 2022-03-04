import React, { FC, ReactNode, useState } from "react";
import Button from "./Button";
import Hr from "./Hr";

interface props {
  onConfirm: () => void; 
  children: ReactNode;
  confirmText?: string;
}

const Wizard: FC<props> = ({
  onConfirm,
  children,
  confirmText
}) => {
  const [step, setStep] = useState<number>(0);
  const childrenArray = React.useMemo(
    () => React.Children.toArray(children),
    [children]
  );
  const childrenCount = React.useMemo(
    () => React.Children.count(children),
    [children]
  );
  const activeChild = React.useMemo(
    () => childrenArray[step],
    [childrenArray, step]
  );
  const isFirstStep = step === 0;
  const isLastStep = step === childrenCount - 1;

  const handleNext = () =>
    setStep((curr) => Math.min(curr + 1, childrenCount - 1));
  const handlePrev = () => setStep((curr) => Math.max(0, curr - 1));

  return (
    <div>
      {activeChild}
      <Hr />
      <div className="md:flex items-center justify-end">
        {!isFirstStep && <div className="pr-2"><Button onClick={handlePrev}>{"< Back"}</Button></div>}
        {isLastStep ? (
          <Button onClick={onConfirm}>{confirmText ?? "Confirm"}</Button>
        ) : (
          <Button onClick={handleNext}>{"Next >"}</Button>
        )}
      </div>
    </div>
  );
};

export default Wizard;
