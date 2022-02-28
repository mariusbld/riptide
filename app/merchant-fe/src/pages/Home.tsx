import React, { FC } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Route, Routes } from "react-router-dom";
import CreateCampaign from "./CreateCampaign";
import CampaignList from "./CampaignList";
import CampaignDetails from "./CampaignDetails";

const ConnectWallet: FC = () => <WalletMultiButton />;

const Home: FC = () => {
  const wallet = useWallet();
  if (!wallet.connected) {
    return <ConnectWallet />;
  }
  return (
    <Routes>
      <Route path="/campaigns/create" element={<CreateCampaign />} />
      <Route path="/campaigns/:id" element={<CampaignDetails />} />
      <Route path="/" element={<CampaignList />} />
    </Routes>
  );
};

export default Home;
