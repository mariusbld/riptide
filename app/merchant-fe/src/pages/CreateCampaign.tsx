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
  const totalAmount = getTotalAmount(config.prizeData);
  const sortByAmountDesc = (a: Prize, b: Prize): number => b.amount - a.amount;
  const isEmpty = !config.prizeData.entries.length;
  return (
    <>
      <AddPrize onAdd={addPrize} />
      <Hr />
      {isEmpty && <div>No prize entries</div>}
      {!isEmpty && 
        <div>
          <div>
            {config.prizeData.entries.sort(sortByAmountDesc).map((prize, idx) => (
              <div key={idx}>
                {prize.count}
                {" X "}
                {prize.amount.toFixed(2)}
                {" USDC "}
                <Button small onClick={() => removePrize(idx)}>{"Remove -"}</Button>
              </div>
            ))}
          </div>
          <div className="py-4">
            {"Total: "}
            {totalAmount}
            {" USDC"}
          </div>
        </div>
      }
    </>
  );
};

const Step4Confirm: FC<StepParams> = ({ config }) => {
  const totalAmount = getTotalAmount(config.prizeData);
  const percentOfSales = (totalAmount * 100) / config.endSalesAmount!;
  return (
    <>
      <h2>Confirm Campaign</h2>
      <div>
        <h3>Target Sales Volume</h3>
        <div>{toCurrencyString(config.endSalesAmount!)} USDC</div>
        <h3>Prizes</h3>
        <div>
          {config.prizeData.entries.map((prize, idx) => (
            <div key={idx}>
              {prize.count}
              {" X "}${toCurrencyString(prize.amount)}
              {" = "}
              {toCurrencyString(prize.count * prize.amount)}
              {" USDC "}
            </div>
          ))}
        </div>
        <h3>Campaign Budget</h3>
        <div>{`Total: ${toCurrencyString(totalAmount)} USDC`}</div>
        <div>{`Percent of Sales Volume: ${percentOfSales.toFixed(2)} %`}</div>
      </div>
    </>
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
      <Wizard onConfirm={handleCreate}>
        <Step1SalesGoal config={config} setConfig={setConfig} />
        <Step2Prizes config={config} setConfig={setConfig} />
        <Step4Confirm config={config} setConfig={setConfig} />
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
