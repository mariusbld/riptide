import React, { FC, ReactNode, useMemo } from "react";
import { WalletProvider } from "@solana/wallet-adapter-react";
import { ConnectionProvider } from "./contexts/ConnectionProvider";
import {
  PhantomWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { ThemeProvider } from "./contexts/ThemeProvider";
import { GlobalStyles } from "./components/globalStyles";
import { EndpointProvider } from "./contexts/EndpointProvider";
import { useDarkMode } from "./hooks/useDarkMode";
import { DarkModeProvider } from "./contexts/DarkModeProvider";
import Button from "./components/Button";
import Home from "./pages/Home";
import { ProgramProvider } from "./contexts/ProgramProvider";
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";

// require('./app.scss');

require("@solana/wallet-adapter-react-ui/styles.css");

export const App: FC = () => (
  <Context>
    <Content />
  </Context>
);

const Context: FC<{ children: ReactNode }> = ({ children }) => {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new TorusWalletAdapter()],
    []
  );

  return (
    <DarkModeProvider>
      <ThemeProvider>
        <>
          <GlobalStyles />
          <EndpointProvider>
            <ConnectionProvider>
              <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                  <ProgramProvider>{children}</ProgramProvider>
                </WalletModalProvider>
              </WalletProvider>
            </ConnectionProvider>
          </EndpointProvider>
        </>
      </ThemeProvider>
    </DarkModeProvider>
  );
};

const Content: FC = () => {
  const { toggle } = useDarkMode();
  return (
    <div>
      <Button onClick={toggle}>Switch Theme</Button>
      <Home />
    </div>
  );
};
