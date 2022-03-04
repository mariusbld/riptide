import React, { FC, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Wizard from "../components/Wizard";
import {
  CampaignConfig,
  Prize,
  PrizeData,
  useProgram
} from "../hooks/useProgram";
import { toCurrencyString } from "../utils/format";
import { Link } from "react-router-dom";
import NumberInput from "../components/NumberInput";
import Hr from "../components/Hr";
import Gift from "../components/svg/Gift";

const DEFAULT_TARGET_SALES_AMOUNT_USDC = 10000;
const DEFAULT_PRIZE_COUNT = 1;
const DEAFULT_PRIZE_AMOUNT = 0;

const defaultConfig: CampaignConfig = {
  prizeData: {
    entries: [],
  },
  end: "targetSalesReached",
  endDate: undefined,
  endSalesAmount: DEFAULT_TARGET_SALES_AMOUNT_USDC,
};

interface StepParams {
  config: CampaignConfig;
  setConfig: (create: CampaignConfig) => void;
}

const Step1SalesGoal: FC<StepParams> = ({ config, setConfig }) => {
  const setEndSalesAmount = (endSalesAmount: number) =>
    setConfig({ ...config, endSalesAmount });

  return (
    <>
      <p className="pb-2">What is your sales volume goal for this campaign?</p>
      {/* <p>Campaign ends when this sales amount is reached.</p> */}
      <div className="w-40">
        <NumberInput suffix="USDC" value={config.endSalesAmount} onChange={setEndSalesAmount} />
      </div>
    </>
  );
};

const AddPrize: FC<{ onAdd: (prize: Prize) => void }> = ({ onAdd }) => {
  const [count, setCount] = useState(DEFAULT_PRIZE_COUNT);
  const [amount, setAmount] = useState(DEAFULT_PRIZE_AMOUNT);
  const valid = useMemo(() => count > 0 && amount > 0, [count, amount]);

  const handleAdd = () => {
    const prize: Prize = { count, amount };
    onAdd(prize);
    clear();
  };

  const clear = () => {
    setCount(DEFAULT_PRIZE_COUNT);
    setAmount(DEAFULT_PRIZE_AMOUNT);
  };

  return (
    <div className="flex flex-row items-end">
      <div className="w-40">
        <NumberInput integer label="Number of prizes" value={count} onChange={setCount} />
      </div>
      <div className="px-4 mb-1">{" X "}</div>
      <div className="w-40 pr-4">
        <NumberInput label="Prize amount" suffix="USDC" value={amount} onChange={setAmount} />
      </div>
      <Button small disabled={!valid} onClick={handleAdd}>
        {"Add +"}
      </Button>
    </div>
  );
};

const PrizeTable: FC<{ prizeData: PrizeData, remove?: (idx: number) => void }> = ({ prizeData, remove }) => {
  const totalAmount = getTotalAmount(prizeData);
  const sortByAmountDesc = (a: Prize, b: Prize): number => b.amount - a.amount;
  return (
    <div>
      {prizeData.entries.sort(sortByAmountDesc).map((prize, idx) => (
        <div className="grid grid-cols-9 text-center hover:bg-white/10 group rounded-full whitespace-nowrap" key={idx}>
          <div className="py-2">{prize.count}</div>
          <div className="py-2">{" X "}</div>
          <div className="py-2 col-span-2 text-right">{toCurrencyString(prize.amount)}{" USDC "}</div>
          <div className="py-2">{" = "}</div>
          <div className="py-2 col-span-2 text-right">{toCurrencyString(prize.count * prize.amount)}{" USDC "}</div>
          <div className="col-span-2 text-right hidden group-hover:block">
            {remove && <Button small onClick={() => remove(idx)}>{"Remove -"}</Button>}
          </div>
        </div>
      ))}
      <div className={`py-4 grid grid-cols-9 text-center`}>
        <div className="col-span-2"></div>
        <div className="col-span-2 text-right">Total</div>
        <div>{" = "}</div>
        <div className="col-span-2 text-right">{toCurrencyString(totalAmount)}{" USDC"}</div>
        <div className="col-span-2"></div>
      </div>
    </div>
  );
}

const Step2Prizes: FC<StepParams> = ({ config, setConfig }) => {
  const setConfigPrizeEntries = (entries: Prize[]) =>
    setConfig({
      ...config,
      prizeData: {
        ...config.prizeData,
        entries,
      },
    });
  const addPrize = (prize: Prize) => {
    const entries = [...config.prizeData.entries, prize];
    setConfigPrizeEntries(entries);
  };
  const removePrize = (idx: number) => {
    const entries = [...config.prizeData.entries];
    entries.splice(idx, 1);
    setConfigPrizeEntries(entries);
  };
  const isEmpty = !config.prizeData.entries.length;
  return (
    <>
      <AddPrize onAdd={addPrize} />
      <Hr />
      {isEmpty && <div>No prize entries</div>}
      {!isEmpty && <PrizeTable prizeData={config.prizeData} remove={removePrize} />}
    </>
  );
};

const Step3Confirm: FC<StepParams> = ({ config }) => {
  const totalAmount = getTotalAmount(config.prizeData);
  const percentOfSales = (totalAmount * 100) / config.endSalesAmount!;
  const isEmpty = !config.prizeData.entries.length;
  return (
    <div>
      <div className="flex flex-row items-center justify-center">
        <div className="text-right flex flex-col items-center">
          <div className="flex flex-row items-start py-2">
            <div className="w-48 font-bold">Target Sales Volume:</div>
            <div className="w-40">{toCurrencyString(config.endSalesAmount!)} USDC</div>
          </div>
          <div className="flex flex-row items-start py-2">
            <div className="w-48 font-bold">Rewards Total:</div>
            <div className="w-40">{toCurrencyString(totalAmount)} USDC</div>
          </div>
          <div className="flex flex-row items-start py-2">
            <div className="w-48 font-bold">Percent of Sales Volume:</div>
            <div className="w-40">{percentOfSales.toFixed(2)} %</div>
          </div>
        </div>
        <div className="mx-8 w-36 h-36">
          <Gift />
        </div>
      </div>
      <Hr />
      <div className="font-bold pb-4">Prize List</div>
      {isEmpty && <div>No prize entries</div>}
      {!isEmpty && <PrizeTable prizeData={config.prizeData} />}
    </div>
  );
};

const CreateCampaign: FC = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<CampaignConfig>(defaultConfig);
  const program = useProgram();
  const handleCreate = async () => {
    try {
      const campaignId = await program.createCampaign(config);
      alert("Success!");
      navigate(`/campaigns/${campaignId}`);
    } catch {
      alert("Encountered an error while trying to create the campaign!");
    }
  };

  return (
    <div>
      <Link className="text-secondary-light dark:text-secondary-dark text-lg" to={{pathname: "/campaigns"}}>
        {"< All campaigns"}
      </Link>
      <h2 className="text-2xl font-bold leading-7 sm:text-3xl sm:truncate my-6">Setup Rewards Campaign</h2>
      <div className="border-t border-zinc-400/50 mb-6"></div>
      <Wizard onConfirm={handleCreate} confirmText={"Create Campaign"}>
        <Step1SalesGoal config={config} setConfig={setConfig} />
        <Step2Prizes config={config} setConfig={setConfig} />
        <Step3Confirm config={config} setConfig={setConfig} />
      </Wizard>
    </div>
  );
};

const getTotalAmount = (prizeData: PrizeData): number => {
  return prizeData.entries.reduce(
    (prev, curr) => prev + curr.amount * curr.count,
    0
  );
};

export default CreateCampaign;
