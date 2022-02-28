import React, { FC } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Route, Routes } from "react-router-dom";
import CreateCampaign from "./CreateCampaign";
import CampaignList from "./CampaignList";

const ConnectWallet: FC = () => <WalletMultiButton />;

const Home: FC = () => {
  const wallet = useWallet();
  if (!wallet.connected) {
    return <ConnectWallet />;
  }
  return (
    <Routes>
      <Route path="/create" element={<CreateCampaign />} />
      <Route path="/" element={<CampaignList />} />
    </Routes>
  );
};

export default Home;
