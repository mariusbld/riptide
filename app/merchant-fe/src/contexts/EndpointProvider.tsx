import React, { FC, ReactNode, useMemo, useState } from "react";
import { clusterApiUrl } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { EndpointName, EndpointContext } from "../hooks/useEndpoint";
import { useLocalStorage } from "../hooks/useLocalStorage";

const LOCAL_ENDPOINT_URL = "http://127.0.0.1:8899";
const GENESYS_ENDPOINT_URL = "https://ssc-dao.genesysgo.net";

const getEndpointUrl = (endpoint: EndpointName): string => {
  if (endpoint === "local") {
    return LOCAL_ENDPOINT_URL;
  } else if (endpoint === "mainnet-beta") {
    return GENESYS_ENDPOINT_URL;
  }
  return clusterApiUrl(endpoint as WalletAdapterNetwork);
};

export const EndpointProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [endpoint, setEndpoint] = useLocalStorage(
    "endpoint",
    "mainnet-beta" as EndpointName // default to devnet
  );
  const url = useMemo(() => getEndpointUrl(endpoint), [endpoint]);
  return (
    <EndpointContext.Provider value={{ setEndpoint, endpoint, url }}>
      {children}
    </EndpointContext.Provider>
  );
};
