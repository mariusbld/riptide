import { PublicKey } from "@solana/web3.js";
import React, { FC, ReactNode, useMemo } from "react";
import { ConfigContext, TokenMint } from "../hooks/useConfig";
import { EndpointName, useEndpoint } from "../hooks/useEndpoint";

// const PROGRAM_ID = "371nGytFGTK1wymnzyk9JdJM52AqjCkeYwRFtB8LRHAL";

const PROGRAM_ID = new Map<EndpointName, PublicKey>([
  ["local", new PublicKey("6w7wDruHf7m7VRatAxQqF1HgQ84brYJggbGuZSvdX43J")],
  ["devnet", new PublicKey("6w7wDruHf7m7VRatAxQqF1HgQ84brYJggbGuZSvdX43J")],
  [
    "mainnet-beta",
    new PublicKey("6w7wDruHf7m7VRatAxQqF1HgQ84brYJggbGuZSvdX43J"),
  ],
]);

const USDC_MINT = new Map<EndpointName, TokenMint>([
  [
    "local",
    {
      publicKey: new PublicKey("CwP87NfhNJuwHpbGt8yBZLS1T8uTSGkf9tDJjqQjTwrj"),
      decimals: 0,
    },
  ],
  [
    "devnet",
    {
      publicKey: new PublicKey("8gXpsEei2wxT2JNo3tsGMC8oa6Ae5S6VEX686v4DMdKr"),
      decimals: 6,
    },
  ],
  [
    "mainnet-beta",
    {
      publicKey: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
      decimals: 6,
    },
  ],
]);

export const ConfigProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { endpoint } = useEndpoint();
  const usdcMint = useMemo<TokenMint>(
    () => USDC_MINT.get(endpoint)!,
    [endpoint]
  );
  const programId = useMemo<PublicKey>(
    () => PROGRAM_ID.get(endpoint)!,
    [endpoint]
  );
  return (
    <ConfigContext.Provider value={{ usdcMint, programId }}>
      {children}
    </ConfigContext.Provider>
  );
};
