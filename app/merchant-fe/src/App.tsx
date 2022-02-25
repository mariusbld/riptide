import React, { FC, ReactNode, useMemo } from 'react';
import { clusterApiUrl } from '@solana/web3.js';
import { SessionProvider, useSession } from './hooks/useSession';
import { PaymentProvider } from './hooks/usePayment';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { ThemeProvider, useTheme } from "styled-components";
import { useDarkMode, darkModeType, toggleDarkModeType } from "./components/useDarkMode";
import { GlobalStyles } from "./components/globalStyles";
import { themeType, lightTheme, darkTheme } from "./components/Themes";
import Toggle from "./components/Toggler";
import CreateCampaign from './components/CreateCampaign';

// require('./app.scss');

// require('@solana/wallet-adapter-react-ui/styles.css');

export const App: FC = () => {
  const [theme, themeToggler] = useDarkMode();
  return (
    <Context theme={theme}>
      <Content themeToggler={themeToggler} />
    </Context>
  );
};

const Context: FC<{ theme: darkModeType, children: ReactNode }> = ({ theme, children }) => {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(() => [
    new PhantomWalletAdapter()
  ], []);

  const themeMode: themeType = theme === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeProvider theme={themeMode}>
      <>
        <GlobalStyles />
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets}>
            <SessionProvider>
              <PaymentProvider>
                {children}
              </PaymentProvider>
            </SessionProvider>
          </WalletProvider>
        </ConnectionProvider>
      </>
    </ThemeProvider>
  );
};

const Content: FC<{ themeToggler: toggleDarkModeType }> = ({ themeToggler }) => {
  const theme = useTheme() as themeType;
  return <>
    <Toggle theme={theme} toggleTheme={themeToggler} />
    <CreateCampaign />
  </>
  // const { scope } = useSession();

  // switch (scope) {
  //   case "payment":
  //     return <Payment />;
  //   case "onboarding":
  //     return <Onboard />;
  //   default:
  //     return null;
  // }
}
