import { PublicKey } from "@solana/web3.js";

export const toDisplayStr = (pk: PublicKey) => {
  const str = pk.toString();
  const top = str.substring(0, 4);
  const bottom = str.substring(str.length - 4, str.length);
  return `${top}...${bottom}`;
};
