import React, { FC } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Route, Routes, Navigate } from "react-router-dom";
import CreateCampaign from "./CreateCampaign";
import CampaignList from "./CampaignList";
import CampaignDetails from "./CampaignDetails";

const Home: FC = () => {
  const wallet = useWallet();
  if (!wallet.connected) {
    return <div className="text-center pt-16">Please connect your wallet.</div>;
  }
  return (
    <Routes>
      <Route path="/campaigns/create" element={<CreateCampaign />} />
      <Route path="/campaigns/:id" element={<CampaignDetails />} />
      <Route path="/campaigns" element={<CampaignList />} />
      <Route path="/" element={<Navigate to="/campaigns" />} />
    </Routes>
  );
};

export default Home;
