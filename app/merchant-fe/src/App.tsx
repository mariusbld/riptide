import { WalletProvider } from "@solana/wallet-adapter-react";
import {
  WalletModalProvider
} from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  TorusWalletAdapter
} from "@solana/wallet-adapter-wallets";
import React, { FC, ReactNode, useMemo } from "react";
import Button from "./components/Button";
import { GlobalStyles } from "./components/globalStyles";
import { ConnectionProvider } from "./contexts/ConnectionProvider";
import { DarkModeProvider } from "./contexts/DarkModeProvider";
import { EndpointProvider } from "./contexts/EndpointProvider";
import { ProgramProvider } from "./contexts/ProgramProvider";
import { ThemeProvider } from "./contexts/ThemeProvider";
import { useDarkMode } from "./hooks/useDarkMode";
import Home from "./pages/Home";

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
