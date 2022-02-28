import React, { useEffect, useState } from "react";
import { useWallet, WalletContextState } from "@solana/wallet-adapter-react";
import { Provider, web3 } from "@project-serum/anchor";
import { ConfirmOptions } from "@solana/web3.js";
import { useEndpoint } from "./useEndpoint";

const { Connection } = web3;

function toAnchorWallet(wallet: WalletContextState) {
  if (!wallet.connected) {
    return null;
  }
  if (
    !wallet.publicKey ||
    !wallet.signMessage ||
    !wallet.signTransaction ||
    !wallet.signAllTransactions
  ) {
    return null;
  }
  return Object.assign(
    {},
    {
      publicKey: wallet.publicKey,
      signMessage: wallet.signMessage,
      signTransaction: wallet.signTransaction,
      signAllTransactions: wallet.signAllTransactions,
    }
  );
}

export function useProvider() {
  const [provider, setProvider] = useState<Nullable<Provider>>(null);
  const wallet = useWallet();
  const endpoint = useEndpoint();

  useEffect(() => {
    const anchorWallet = toAnchorWallet(wallet);
    if (!anchorWallet) {
      setProvider(null);
      return;
    }
    const opts: ConfirmOptions = {
      preflightCommitment: "processed",
    };
    const connection = new Connection(endpoint.url, opts.preflightCommitment);
    setProvider(new Provider(connection, anchorWallet, opts));
  }, [wallet, endpoint]);

  return provider;
}
