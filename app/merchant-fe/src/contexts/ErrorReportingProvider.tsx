import React, { FC, ReactNode, useCallback, useState } from "react";
import { ErrorReportingContext } from "../hooks/useErrorReporting";

interface props {
  children: ReactNode;
}

const DEFAULT_MODAL_TEXT = "Something went wrong.";
const DEFAULT_MODAL_TITLE = "Ooops!";

export const ErrorReportingProvider: FC<props> = ({ children }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalText, setModalText] = useState<string>();
  const [modalTitle, setModalTitle] = useState<string>();

  const showError = useCallback((text?: string, title?: string) => {
    setModalText(text ?? DEFAULT_MODAL_TEXT);
    setModalTitle(title ?? DEFAULT_MODAL_TITLE);
    setModalOpen(true);
  }, []);

  return (
    <ErrorReportingContext.Provider
      value={{
        showError,
        modalText,
        modalTitle,
        modalOpen,
        setModalOpen,
      }}
    >
      {children}
    </ErrorReportingContext.Provider>
  );
};
