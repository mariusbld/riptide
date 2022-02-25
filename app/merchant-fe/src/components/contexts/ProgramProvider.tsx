import React, { FC, ReactNode, useEffect, useState } from "react";
import { Keypair } from "@solana/web3.js";
import { Idl, Program, web3 } from '@project-serum/anchor';
import { CampaignId, CampaignConfig, ProgramContext, Campaign } from "../../hooks/useProgram";
import { useProvider } from "../../hooks/useProvider";
import idl from "../../riptide.json";


const PROGRAM_ID = "6rjN1JJZJQnGw5ppeN2ppXtvVpzq3mJbxNyDpiMaJ18H";

export interface ProgramProviderProps {
  children: ReactNode;
}

export const ProgramProvider: FC<ProgramProviderProps> = ({ children }) => {
  const [program, setProgram] = useState<Nullable<Program>>(null);
  const provider = useProvider();

  useEffect(() => {
    let localProgram: Nullable<Program> = null;
    if (provider) {
      localProgram = new Program(idl as Idl, PROGRAM_ID, provider);
    }
    setProgram(localProgram);
  }, [provider]);

  // const { connection } = useConnection();
  const createCampaign = (conf: CampaignConfig): CampaignId => {
    const keypair = Keypair.generate();
    return keypair.publicKey;
  }
  const getCampaign = (): Campaign => {
    return {
      config: { start: "now", end: "salesVolume", prizes: [] },
      stats: { prizesAwarded: [] }
    };
  }
  const listCampaigns = (): Campaign[] => {
    return [];
  }
  const startCampaign = (id: CampaignId) => {}
  const stopCampaign = (id: CampaignId) => {}
  const revokeCampaign = (id: CampaignId) => {}

  return (
    <ProgramContext.Provider
      value={{
        createCampaign,
        getCampaign,
        listCampaigns,
        startCampaign,
        stopCampaign,
        revokeCampaign
      }}
    >
      {children}
    </ProgramContext.Provider>
  );
}
