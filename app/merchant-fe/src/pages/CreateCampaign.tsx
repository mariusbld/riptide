import React, { FC, useMemo, useState } from "react";
import Wizard from "../components/Wizard";
import DatePicker from "react-date-picker";
import Button from "../components/Button";
import {
  CampaignConfig,
  CampaignEndType,
  CampaignStartType,
  Prize,
  PrizeData,
  useProgram,
} from "../hooks/useProgram";

const DEFAULT_TARGET_SALES_AMOUNT_USDC = 10000;

const defaultConfig: CampaignConfig = {
  prizeData: {
    entries: [],
  },
  start: "manual",
  end: "targetSalesReached",
  endDate: undefined,
  endSalesAmount: DEFAULT_TARGET_SALES_AMOUNT_USDC,
};

interface StepParams {
  config: CampaignConfig;
  setConfig: (create: CampaignConfig) => void;
}

const Step1Start: FC<StepParams> = ({ config, setConfig }) => {
  const setStart = (start: CampaignStartType) =>
    setConfig({ ...config, start });
  const startOptions: { label: string; value: CampaignStartType }[] = [
    { label: "Now", value: "now" },
    { label: "Manual", value: "manual" },
  ];
  return (
    <>
      <h2>Campaign Starts</h2>
      <div>
        {startOptions.map(({ label, value }) => (
          <label key={value}>
            <input
              name="start"
              type="checkbox"
              value={value}
              onChange={() => setStart(value)}
              checked={config.start === value}
            />
            {label}
          </label>
        ))}
      </div>
    </>
  );
};

const Step2Ends: FC<StepParams> = ({ config, setConfig }) => {
  const setEnd = (end: CampaignEndType) => setConfig({ ...config, end });
  const setEndDate = (targetEndDate: Date) =>
    setConfig({ ...config, endDate: targetEndDate });
  const setEndSalesAmount = (endSalesAmount: number) =>
    setConfig({ ...config, endSalesAmount });
  const endOptions: { label: string; value: CampaignEndType }[] = [
    { label: "Spefici Date", value: "scheduledDate" },
    { label: "When Sales Amount is Reached", value: "targetSalesReached" },
  ];
  return (
    <>
      <h2>Campaign Ends</h2>
      <div>
        {endOptions.map(({ label, value }) => (
          <label key={value}>
            <input
              name="start"
              type="checkbox"
              value={value}
              onChange={() => setEnd(value)}
              checked={config.end === value}
            />
            {label}
          </label>
        ))}
      </div>
      {config.end === "targetSalesReached" && (
        <label>
          <input
            type={"number"}
            onChange={(e) => setEndSalesAmount(parseInt(e.target.value))}
            value={config.endSalesAmount}
          />
          USDC
        </label>
      )}
      {config.end === "scheduledDate" && (
        <DatePicker onChange={setEndDate} value={config.endDate} />
      )}
    </>
  );
};

const AddPrize: FC<{ onAdd: (prize: Prize) => void }> = ({ onAdd }) => {
  const [count, setCount] = useState(1);
  const [amount, setAmount] = useState(0);
  const valid = useMemo(() => count > 0 && amount > 0, [count, amount]);

  return (
    <div>
      <label>
        <input
          type="number"
          onChange={(e) => setCount(parseInt(e.target.value))}
          value={count}
        />
      </label>
      {" X "}
      <label>
        <input
          type="number"
          onChange={(e) => setAmount(parseInt(e.target.value))}
          value={amount}
        />
        {" USDC "}
      </label>
      <Button disabled={!valid} onClick={() => onAdd({ count, amount })}>
        {"Add >>"}
      </Button>
    </div>
  );
};

const Step3Prizes: FC<StepParams> = ({ config, setConfig }) => {
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
    entries.splice(idx);
    setConfigPrizeEntries(entries);
  };
  const totalAmount = getTotalAmount(config.prizeData);
  return (
    <>
      <h2>Prizes</h2>
      <div>
        {config.prizeData.entries.map((prize, idx) => (
          <div key={idx}>
            {prize.count}
            {" X "}
            {prize.amount.toFixed(2)}
            {" USDC "}
            <Button onClick={() => removePrize(idx)}>Remove</Button>
          </div>
        ))}
      </div>
      <AddPrize onAdd={addPrize} />
      <div>
        {"Total: "}
        {totalAmount}
        {" USDC"}
      </div>
    </>
  );
};

const Step4Confirm: FC<StepParams> = ({ config }) => {
  const totalAmount = getTotalAmount(config.prizeData);
  return (
    <>
      <h2>Confirm Campaign</h2>
      <div>
        <h3>Start</h3>
        <div>{config.start}</div>
        <h3>End</h3>
        <div>{config.end}</div>
        <h3>Prizes</h3>
        <div>
          {config.prizeData.entries.map((prize, idx) => (
            <div key={idx}>
              {prize.count}
              {" X "}${prize.amount}
              {" = "}
              {prize.count * prize.amount}
              {" USDC "}
            </div>
          ))}
        </div>
        <h3>Deposit Funds</h3>
        <div>
          {"Total: "}
          {totalAmount}
          {" USDC "}
        </div>
      </div>
    </>
  );
};

const CreateCampaign: FC = () => {
  const [config, setConfig] = useState<CampaignConfig>(defaultConfig);
  const program = useProgram();
  const handleConfirm = async () => {
    await program.createCampaign(config);
    console.log("Done!");
  };
  return (
    <Wizard onConfirm={handleConfirm}>
      <Step1Start config={config} setConfig={setConfig} />
      <Step2Ends config={config} setConfig={setConfig} />
      <Step3Prizes config={config} setConfig={setConfig} />
      <Step4Confirm config={config} setConfig={setConfig} />
    </Wizard>
  );
};

const getTotalAmount = (prizeData: PrizeData): number => {
  return prizeData.entries.reduce(
    (prev, curr) => prev + curr.amount * curr.count,
    0
  );
};

export default CreateCampaign;
