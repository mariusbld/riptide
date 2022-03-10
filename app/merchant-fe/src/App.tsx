import { ExternalLinkIcon } from "@heroicons/react/solid";
import { useWallet, WalletProvider } from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import {
  PhantomWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { PublicKey } from "@solana/web3.js";
import React, { FC, ReactNode, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Dropdown, { DropdownItem } from "./components/Dropdown";
import PhoriaLogo from "./components/svg/PhoriaLogo";
import ToggleButton from "./components/ToggleButton";
import { AuthProvider } from "./contexts/AuthProvider";
import { ConfigProvider } from "./contexts/ConfigProvider";
import { ConnectionProvider } from "./contexts/ConnectionProvider";
import { DarkModeProvider } from "./contexts/DarkModeProvider";
import { EndpointProvider } from "./contexts/EndpointProvider";
import { ProgramProvider } from "./contexts/ProgramProvider";
import { useAuth } from "./hooks/useAuth";
import { useDarkMode } from "./hooks/useDarkMode";
import { EndpointName, useEndpoint } from "./hooks/useEndpoint";
import { useProgram } from "./hooks/useProgram";
import Home from "./pages/Home";
import { capitalize } from "./utils/format";

const POS_URL = process.env.REACT_APP_POS_URL ?? "";
const PHORIA_KEY = process.env.REACT_APP_PHORIA_KEY ?? "";
const PHORIA_LABEL = "Solana Pay POS";

const getPosUrl = (walletKey: PublicKey, campaignKeys: PublicKey[]): string => {
  const url = new URL(POS_URL);
  url.searchParams.append("recipient", walletKey.toString());
  url.searchParams.append("label", PHORIA_LABEL);
  url.searchParams.append("reference", PHORIA_KEY);
  campaignKeys.forEach((key) =>
    url.searchParams.append("reference", key.toString())
  );
  return url.toString();
};

const EndpointOptions: EndpointName[] = ["local", "devnet"];

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
    <AuthProvider>
      <DarkModeProvider>
        <EndpointProvider>
          <ConfigProvider>
            <ConnectionProvider>
              <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                  <ProgramProvider>{children}</ProgramProvider>
                </WalletModalProvider>
              </WalletProvider>
            </ConnectionProvider>
          </ConfigProvider>
        </EndpointProvider>
      </DarkModeProvider>
    </AuthProvider>
  );
};

const Navbar: FC = () => {
  const { toggle } = useDarkMode();
  const wallet = useWallet();
  const program = useProgram();
  const [posUrl, setPosUrl] = useState<string>();
  const { endpoint, setEndpoint } = useEndpoint();
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      if (
        !wallet ||
        !wallet.connected ||
        !wallet.publicKey ||
        !program ||
        !user
      ) {
        setPosUrl(undefined);
        return;
      }
      const activeCampaigns = await program.listActiveCampaigns();
      const activeCampaignKeys = activeCampaigns.map((c) => c.id);
      const url = getPosUrl(wallet.publicKey, activeCampaignKeys);
      setPosUrl(url);
    })();
  }, [wallet, wallet.connected, program, user]);

  const copyPosUrl = () => {
    posUrl && navigator.clipboard.writeText(posUrl);
  };

  return (
    <div className="flex justify-between items-baseline py-8 md:justify-start md:space-x-10">
      <div className="flex justify-start lg:w-0 lg:flex-1">
        <Link to="/">
          <span className="sr-only">Phoria</span>
          <PhoriaLogo />
        </Link>
      </div>
      <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
        <div className="mr-8">
          <ToggleButton onChange={toggle} />
        </div>
        <Dropdown disabled={!posUrl} transparent label="Point of Sale">
          <DropdownItem href={posUrl}>
            <div className="flex flex-row items-center justify-between">
              <span>Open</span>
              <span>
                <ExternalLinkIcon className="w-5 h-5 ml-1" />
              </span>
            </div>
          </DropdownItem>
          <DropdownItem onClick={copyPosUrl}>Copy Link</DropdownItem>
        </Dropdown>
        <Dropdown transparent label={capitalize(endpoint)}>
          {EndpointOptions.map((option) => (
            <DropdownItem
              key={option}
              onClick={() => setEndpoint(option)}
              isSelected={option === endpoint}
            >
              {capitalize(option)}
            </DropdownItem>
          ))}
        </Dropdown>
        <div className="ml-8">
          <WalletMultiButton className="text-primary-light dark:text-primary-dark font-mono dark:bg-zinc-600 dark:hover:bg-zinc-500 rounded-full" />
        </div>
      </div>
    </div>
  );
};

const Footer: FC = () => {
  const logo = new URL(
    "./images/solana-pay-logo.png",
    import.meta.url
  ).toString();
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
