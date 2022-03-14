import { PublicKey } from "@solana/web3.js";
import React, { FC, useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import CampaignDetailsSection from "../components/CampaignDetailsSection";
import ConfirmModal, { ModalIcon } from "../components/ConfirmModal";
import Hr from "../components/Hr";
import InfoMessage, { MessageIcon } from "../components/InfoMessage";
import NavLink from "../components/NavLink";
import NumberInput from "../components/NumberInput";
import SectionHeading from "../components/SectionHeading";
import Wizard from "../components/Wizard";
import { useConfig } from "../hooks/useConfig";
import {
  CampaignConfig,
  Prize,
  PrizeData,
  useProgram,
} from "../hooks/useProgram";
import { getTotalPrizeAmount } from "../utils/campaign";
import { toCurrencyString } from "../utils/format";

const DEFAULT_PRIZE_COUNT = 1;
const DEAFULT_PRIZE_AMOUNT = 0;

const defaultConfig: CampaignConfig = {
  prizeData: {
    entries: [],
  },
  end: "targetSalesReached",
  endDate: undefined,
  endSalesAmount: undefined,
};

interface StepParams {
  config: CampaignConfig;
  setConfig: (create: CampaignConfig) => void;
}

const Step1SalesGoal: FC<StepParams> = ({ config, setConfig }) => {
  const setEndSalesAmount = (endSalesAmount: number) =>
    setConfig({ ...config, endSalesAmount });
  const { usdcMint } = useConfig();

  return (
    <>
      <p className="pb-2">What is your sales volume goal for this campaign?</p>
      <div className="flex flex-row items-center">
        <div className="w-40">
          <NumberInput
            suffix="USDC"
            value={config.endSalesAmount}
            onChange={setEndSalesAmount}
            placeholder={"e.g. 10000"}
            decimals={usdcMint.decimals}
          />
        </div>
        <div className="px-2 dark:text-secondary-dark">
          <InfoMessage icon={MessageIcon.Info}>
            Campaign ends when this sales amount is reached.
          </InfoMessage>
        </div>
      </div>
    </>
  );
};

const AddPrize: FC<{ onAdd: (prize: Prize) => void }> = ({ onAdd }) => {
  const { usdcMint } = useConfig();
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
        <NumberInput
          integer
          label="Number of prizes"
          value={count}
          onChange={setCount}
        />
      </div>
      <div className="px-4 mb-1">{" X "}</div>
      <div className="w-40 pr-4">
        <NumberInput
          label="Prize amount"
          suffix="USDC"
          value={amount}
          onChange={setAmount}
          decimals={usdcMint.decimals}
        />
      </div>
      <Button small disabled={!valid} onClick={handleAdd}>
        {"Add +"}
      </Button>
    </div>
  );
};

const PrizeTable: FC<{
  prizeData: PrizeData;
  remove?: (idx: number) => void;
}> = ({ prizeData, remove }) => {
  const { usdcMint } = useConfig();
  const totalAmount = getTotalPrizeAmount(prizeData);
  const sortByAmountDesc = (a: Prize, b: Prize): number => b.amount - a.amount;
  return (
    <div>
      {prizeData.entries.sort(sortByAmountDesc).map((prize, idx) => (
        <div
          className="grid grid-cols-9 text-center hover:bg-black/10 dark:hover:bg-white/10 group rounded-full whitespace-nowrap"
          key={idx}
        >
          <div className="py-2">{prize.count}</div>
          <div className="py-2">{" X "}</div>
          <div className="py-2 col-span-2 text-right">
            {toCurrencyString(prize.amount, usdcMint.decimals)}
            {" USDC "}
          </div>
          <div className="py-2">{" = "}</div>
          <div className="py-2 col-span-2 text-right">
            {toCurrencyString(prize.count * prize.amount, usdcMint.decimals)}
            {" USDC "}
          </div>
          <div className="col-span-2 text-right hidden group-hover:block">
            {remove && (
              <Button destructive small onClick={() => remove(idx)}>
                {"Remove -"}
              </Button>
            )}
          </div>
        </div>
      ))}
      <div className={`py-4 grid grid-cols-9 text-center`}>
        <div className="col-span-2"></div>
        <div className="col-span-2 text-right">Total</div>
        <div>{" = "}</div>
        <div className="col-span-2 text-right">
          {toCurrencyString(totalAmount, usdcMint.decimals)}
          {" USDC"}
        </div>
        <div className="col-span-2"></div>
      </div>
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
  const isEmpty = !config.prizeData.entries.length;
  return (
    <>
      <AddPrize onAdd={addPrize} />
      <Hr />
      {isEmpty && <div>No prize entries.</div>}
      {!isEmpty && (
        <PrizeTable prizeData={config.prizeData} remove={removePrize} />
      )}
    </>
  );
};

const Step3Confirm: FC<StepParams> = ({ config }) => {
  const isEmpty = !config.prizeData.entries.length;
  return (
    <div>
      <CampaignDetailsSection config={config} />
      <Hr />
      <div className="font-bold pb-4">Prize List</div>
      {isEmpty && <div>No prize entries.</div>}
      {!isEmpty && <PrizeTable prizeData={config.prizeData} />}
    </div>
  );
};

const CreateCampaign: FC = () => {
  const program = useProgram();
  const [open, setOpen] = useState(false);
  const [campaignId, setCampaignId] = useState<Nullable<PublicKey>>(null);
  const navigate = useNavigate();
  const [config, setConfig] = useState<CampaignConfig>(defaultConfig);

  const handleCreate = async () => {
    try {
      const id = await program.createCampaign(config);
      setCampaignId(id);
      setOpen(true);
    } catch {
      alert("Encountered an error while trying to create the campaign!");
    }
  };

  const handleGoToDetails = useCallback(() => {
    if (!campaignId) {
      console.error("Missing campaign id!");
      return;
    }
    navigate(`/campaigns/${campaignId}/details`);
  }, [campaignId]);

  return (
    <>
      <ConfirmModal
        open={open}
        setOpen={setOpen}
        onConfirm={handleGoToDetails}
        icon={ModalIcon.Check}
        confirmText="Campaign Details"
        title="Campaign Created!"
      >
        <p className="text-sm text-gray-500">
          Your campaign was successfully created! You can now navigate to the
          campaign details page in order to add funds and start it.
        </p>
      </ConfirmModal>
      <div>
        <NavLink pathname={"/campaigns"}>{"< All campaigns"}</NavLink>
        <SectionHeading>Setup Rewards Campaign</SectionHeading>
        <Hr />
        <Wizard onConfirm={handleCreate} confirmText={"Create Campaign"}>
          <Step1SalesGoal config={config} setConfig={setConfig} />
          <Step2Prizes config={config} setConfig={setConfig} />
          <Step3Confirm config={config} setConfig={setConfig} />
        </Wizard>
      </div>
    </>
  );
};

export default CreateCampaign;
