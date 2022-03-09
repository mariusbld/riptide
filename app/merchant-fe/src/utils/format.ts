import { PublicKey } from "@solana/web3.js";

export const toDisplayString = (pk: PublicKey): string => {
  const str = pk.toString();
  const top = str.substring(0, 4);
  const bottom = str.substring(str.length - 4, str.length);
  return `${top}...${bottom}`;
};

export const toCurrencyString = (n: number): string => {
  return n.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
};

export const capitalize = (s: string): string => {
  if (s.length < 1) {
    return s;
  }
  return s.slice(0, 1).toLocaleUpperCase() + s.slice(1);
};
