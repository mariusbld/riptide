import { PrizeData } from "../hooks/useProgram";

export const getTotalAmount = (prizeData: PrizeData): number => {
  return prizeData.entries.reduce(
    (prev, curr) => prev + curr.amount * curr.count,
    0
  );
};
