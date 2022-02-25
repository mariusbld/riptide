import React, { FC, useState } from "react";
import Wizard from "./Wizard";
import DatePicker from 'react-date-picker';
import Button from "./Button";

type startType = "now" | "scheduled" | "manual";
type endType = "targetSales" | "scheduled";

interface prizeType {
  count: number;
  amount: number;
}

interface createParamsType {
  start: startType;
  startDate: Date | null;
  end: endType;
  endSalesVolume: number | null;
  endDate: Date | null;
  prizes: prizeType[];
}

const defaultParams: createParamsType = {
  start: "manual",
  startDate: null,
  end: "targetSales",
  endSalesVolume: null,
  endDate: null,
  prizes: []
};

type createStepParams = { create: createParamsType, setCreate: (create: createParamsType) => void };

const Step1Start: FC<createStepParams> = ({ create, setCreate }) => {
  const setStart = (start: startType) => setCreate({ ...create, start });
  const setStartDate = (startDate: Date) => setCreate({ ...create, startDate });
  return <>
    <h2>Campaign Starts</h2>
    <div>
      <label>
        <input 
          name="start" 
          type="checkbox" 
          value={"now"} 
          onChange={() => setStart("now")}
          checked={create.start === "now"}
        />
        Now
      </label>
      <label>
        <input 
          name="start" 
          type="checkbox"
          value={"manual"} 
          onChange={() => setStart("manual")} 
          checked={create.start === "manual"} 
        />
        Manual
      </label>
      <label>
        <input 
          name="start" 
          type="checkbox"
          value={"cheduled"} 
          onChange={() => setStart("scheduled")} 
          checked={create.start === "scheduled"} 
        />
        Scheduled
      </label>
    </div>
    {create.start === "scheduled" &&
      <DatePicker onChange={setStartDate} value={create.startDate || new Date()} />
    }
  </>;
};

const Step2Ends: FC<createStepParams> = ({ create, setCreate }) => {
  const setEnd = (end: endType) => setCreate({ ...create, end });
  const setEndDate = (endDate: Date) => setCreate({ ...create, endDate });
  const setEndSalesVolume = (endSalesVolume: number) => setCreate({ ...create, endSalesVolume });
  return <>
    <h2>Campaign Ends</h2>
    <div>
      <label>
        <input 
          name="end" 
          type="checkbox" 
          value={"targetSales"} 
          onChange={() => setEnd("targetSales")}
          checked={create.end === "targetSales"}
        />
        Target Sales Volume
      </label>
      <label>
        <input 
          name="end" 
          type="checkbox" 
          value={"scheduled"} 
          onChange={() => setEnd("scheduled")}
          checked={create.end === "scheduled"}
        />
          Scheduled
      </label>
    </div>
    {create.end === "targetSales" &&
      <label>
        <input 
          type={"number"} 
          onChange={e => setEndSalesVolume(parseInt(e.target.value))} 
          value={create.endSalesVolume || 0} 
        /> 
        USDC
      </label>
    }
    {create.end === "scheduled" &&
      <DatePicker onChange={setEndDate} value={create.endDate || new Date()} />
    }
  </>
};

const AddPrize: FC<{onAdd: (prize: prizeType) => void}> = ({ onAdd }) => {
  const [count, setCount] = useState(1);
  const [amount, setAmount] = useState(100);

  return <div>
    <label><input type="number" onChange={e => setCount(parseInt(e.target.value))} value={count} /></label>
    X
    <label><input type="number" onChange={e => setAmount(parseInt(e.target.value))} value={amount} /> USDC </label>
    <Button onClick={() => onAdd({ count, amount })}>{"Add >>"}</Button>
  </div>;
}

const Step3Prizes: FC<createStepParams> = ({ create, setCreate }) => {
  const addPrize = (prize: prizeType) => {
    const { count, amount } = prize;
    setCreate({ ...create, prizes: [...create.prizes, { count, amount }] });
  };
  const removePrize = (idx: number) => {
    const prizes = [...create.prizes];
    prizes.splice(idx);
    setCreate({ ...create, prizes });
  };
  return <>
    <h2>Prizes</h2>
    <div>
      {
        create.prizes.map((prize, idx) => {
          return (
            <div>{prize.count} X ${prize.amount.toFixed(2)} <Button onClick={() => removePrize(idx)}>Remove</Button></div>
          );
        })
      }
    </div>
    <AddPrize onAdd={addPrize} />
  </>
};

const Step4Confirm: FC<createStepParams> = ({ create }) => {
  const totalPrizeAmount = create.prizes.reduce((prev, curr) => prev + curr.amount * curr.count, 0);
  return <>
    <h2>Confirm Campaign</h2>
    <div>
      <h3>Start</h3>
      <div>{create.start}</div>
      <h3>End</h3>
      <div>{create.end}</div>
      <h3>Prizes</h3>
      <div>
        {
          create.prizes.map(prize => {
            return <div>{prize.count} X ${prize.amount} = ${prize.count * prize.amount}</div>
          })
        }
      </div>
      <h3>Deposit Funds</h3>
      <div>Total: ${totalPrizeAmount}</div>
    </div>
  </>
};

const CreateCampaign: FC = () => {
  const [create, setCreate] = useState<createParamsType>(defaultParams);
  const handleConfirm = () => {
    console.log(`confirming ${create}`);
  };
  return <Wizard onConfirm={handleConfirm}>
    <Step1Start create={create} setCreate={setCreate} />
    <Step2Ends create={create} setCreate={setCreate} />
    <Step3Prizes create={create} setCreate={setCreate} />
    <Step4Confirm create={create} setCreate={setCreate} />
  </Wizard>;
};

export default CreateCampaign;
