import { PublicKey } from "@solana/web3.js";
import { createContext, useContext } from "react";

export interface TokenMint {
  publicKey: PublicKey;
  decimals: number;
}

export interface ConfigContextState {
  usdcMint: TokenMint;
  programId: PublicKey;
}

export const ConfigContext = createContext<ConfigContextState>(
  {} as ConfigContextState
);

export const useConfig = () => {
  return useContext(ConfigContext);
};
