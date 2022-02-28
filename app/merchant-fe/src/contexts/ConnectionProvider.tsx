import React, {FC} from "react";
import { ConnectionProvider as WalletConnectionProvider } from "@solana/wallet-adapter-react";
import { useEndpoint } from "../hooks/useEndpoint";

export const ConnectionProvider: FC = ({ children }) => {
  const { url } = useEndpoint();
  return (
    <WalletConnectionProvider endpoint={url}>
      {children}
    </WalletConnectionProvider>
  );
}
