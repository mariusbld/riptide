import React, { createContext, useContext } from "react";

export interface ErrorReportingState {
  showError(text?: string, title?: string): void;
  modalText?: string;
  modalTitle?: string;
  modalOpen: boolean;
  setModalOpen(open: boolean): void;
}

export const ErrorReportingContext = createContext<ErrorReportingState>(
  {} as ErrorReportingState
);

export const useErrorReporting = () => {
  return useContext(ErrorReportingContext);
};
