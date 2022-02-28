import React, { FC, ReactNode, useState } from "react";

const Wizard: FC<{ onConfirm: () => void; children: ReactNode }> = ({
  onConfirm,
  children,
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
      <div>
        {!isFirstStep && <button onClick={handlePrev}>Prev</button>}
        {isLastStep ? (
          <button onClick={onConfirm}>Confirm</button>
        ) : (
          <button onClick={handleNext}>Next</button>
        )}
      </div>
    </div>
  );
};

export default Wizard;
