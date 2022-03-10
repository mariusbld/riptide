import React, { FC, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Route, Routes, Navigate, Outlet } from "react-router-dom";
import CreateCampaign from "./CreateCampaign";
import CampaignList from "./CampaignList";
import CampaignDetails from "./CampaignDetails";
import ConfirmModal from "../components/ConfirmModal";
import { useAuth } from "../hooks/useAuth";

const Layout: FC = () => {
  const [code, setCode] = useState("");
  const { user, login } = useAuth();
  return (
    <div>
      <ConfirmModal
        open={!user}
        setOpen={() => {}}
        onConfirm={() => login(code)}
        title={"Enter Authentication Code"}
      >
        <p className="text-sm dark:text-secondary-dark py-2">
          We're still in alpha! You need an authentication code to access the
          app. If you don't have one, please reach out to us on Discord.
        </p>
        <div className="mt-1 relative rounded-full shadow-sm">
          <input
            onKeyPress={(e) => e.key === "Enter" && login(code)}
            type="password"
            name="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-full dark:bg-input-bg-dark dark:hover:bg-input-bg-hv-dark dark:text-primary-dark dark:placeholder:text-primary-dark"
          />
        </div>
      </ConfirmModal>
      {!!user && <Outlet />}
    </div>
  );
};

const Home: FC = () => {
  const wallet = useWallet();
  if (!wallet.connected) {
    return <div className="text-center pt-16">Please connect your wallet.</div>;
  }
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/campaigns/create" element={<CreateCampaign />} />
        <Route path="/campaigns/:id" element={<CampaignDetails />} />
        <Route path="/campaigns" element={<CampaignList />} />
        <Route path="/" element={<Navigate to="/campaigns" />} />
      </Route>
    </Routes>
  );
};

export default Home;
