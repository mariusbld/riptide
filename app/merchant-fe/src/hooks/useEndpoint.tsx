import React, { createContext, useContext } from "react";

export type EndpointName = "local" | "testnet" | "devnet" | "mainnet-beta";

export interface EndpointContextState {
  setEndpoint: (endpoint: EndpointName) => void;
  endpoint: EndpointName;
  url: string;
}

export const EndpointContext = createContext<EndpointContextState>(
  {} as EndpointContextState
);

export const useEndpoint = () => {
  return useContext(EndpointContext);
};
