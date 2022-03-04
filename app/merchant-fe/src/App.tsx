import { WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import React, { FC, ReactNode, useMemo } from "react";
import Button from "./components/Button";
import { GlobalStyles } from "./components/globalStyles";
import PhoriaLogo from "./components/svg/PhoriaLogo";
import ToggleButton from "./components/ToggleButton";
import { ConnectionProvider } from "./contexts/ConnectionProvider";
import { DarkModeProvider } from "./contexts/DarkModeProvider";
import { EndpointProvider } from "./contexts/EndpointProvider";
import { ProgramProvider } from "./contexts/ProgramProvider";
import { ThemeProvider } from "./contexts/ThemeProvider";
import { useDarkMode } from "./hooks/useDarkMode";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
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
          {/* <GlobalStyles /> */}
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

const Navbar: FC = () => {
  const { toggle } = useDarkMode();
  return (
    <div className="flex justify-between items-baseline py-8 md:justify-start md:space-x-10">
      <div className="flex justify-start lg:w-0 lg:flex-1">
        <a href="#">
          <span className="sr-only">Phoria</span>
          <PhoriaLogo />
        </a>
      </div>
      <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
        <ToggleButton onChange={toggle} />

        {/* <a href="#" className="whitespace-nowrap text-base font-medium text-gray-500 hover:text-gray-900">
          Sign in
        </a>
        <a
          href="#"
          className="ml-8 whitespace-nowrap inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Sign up
        </a> */}
        <div className="ml-8">
          <WalletMultiButton className="text-primary-light dark:text-primary-dark font-mono dark:bg-zinc-600 dark:hover:bg-zinc-500 rounded-full" />
        </div>
      </div>
    </div>
  );
};

const Footer: FC = () => {
  const logo = new URL("./images/solana-pay-logo.png", import.meta.url);
  return (
    <div className="absolute bottom-0 flex justify-center items-center py-8 w-full">
      <img width={165} src={logo} />
    </div>
  );
};

const Content: FC = () => {
  return (
    <>
      <div className="max-w-7xl max-w mx-auto px-4 sm:px-6">
        <Navbar />
        <div className="max-w-3xl max-w mx-auto px-4 sm:px-6">
          <Home />
        </div>
      </div>
      <Footer />
    </>
  );
};
