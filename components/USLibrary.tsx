import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import useUSElectionContract from "../hooks/useUSElectionContract";

type USContract = {
  contractAddress: string;
};

export enum Leader {
  UNKNOWN,
  BIDEN,
  TRUMP
}

// export enum TransactionStatuses {
//   NONE,
//   PENDING,
//   DONE
// }


const USLibrary = ({ contractAddress }: USContract) => {
  const { account, library } = useWeb3React<Web3Provider>();
  const usElectionContract = useUSElectionContract(contractAddress);
  const [currentLeader, setCurrentLeader] = useState<string>('Unknown');
  const [name, setName] = useState<string | undefined>();
  const [votesBiden, setVotesBiden] = useState<number | undefined>();
  const [votesTrump, setVotesTrump] = useState<number | undefined>();
  const [stateSeats, setStateSeats] = useState<number | undefined>();

  const [txHash, setTxHash] = useState<string>('Unknown');

  const [transactionPending, setTransactionPending] = useState<number>(0);

  const [seatsBiden, setSeatsBiden] = useState<number | undefined>();
  const [seatsTrump, setSeatsTrump] = useState<number | undefined>();

  const contractState: any = {};

  useEffect(() => {
    getCurrentLeader();
  },[])

  const getCurrentLeader = async () => {
    const currentLeader = await usElectionContract.currentLeader();
    setCurrentLeader(currentLeader == Leader.UNKNOWN ? 'Unknown' : currentLeader == Leader.BIDEN ? 'Biden' : 'Trump')

    const bidenSeats = await usElectionContract.seats(Leader.BIDEN);
    setSeatsBiden(bidenSeats);
    const trumpSeats = await usElectionContract.seats(Leader.TRUMP);
    setSeatsTrump(trumpSeats);

    contractState.currentLeader = currentLeader;
    contractState.bidenSeats = bidenSeats;
    contractState.trumpSeats = trumpSeats;

  }

  const stateInput = (input) => {
    setName(input.target.value)
  }

  const bideVotesInput = (input) => {
    setVotesBiden(input.target.value)
  }

  const trumpVotesInput = (input) => {
    setVotesTrump(input.target.value)
  }

  const seatsInput = (input) => {
    setStateSeats(input.target.value)
  }

  const logStateResultHandler = (winner, stateSeats, state, tx) => {

    if(winner == Leader.BIDEN){
      contractState.bidenSeats = contractState.bidenSeats + stateSeats;
      setSeatsBiden(contractState.bidenSeats);  
    }
    else if(winner == Leader.TRUMP){
      contractState.trumpSeats = contractState.trumpSeats + stateSeats;
      setSeatsTrump(contractState.trumpSeats);  
    }

    const newLeader = contractState.bidenSeats == contractState.trumpSeats? Leader.UNKNOWN : contractState.bidenSeats > contractState.trumpSeats? Leader.BIDEN: Leader.TRUMP;
    if(newLeader != contractState.currentLeader){
      contractState.currentLeader = newLeader;
      setCurrentLeader(newLeader == Leader.UNKNOWN ? 'Unknown' : newLeader == Leader.BIDEN ? 'Biden' : 'Trump')
    }
  };

  useEffect(() => {
    usElectionContract.on('LogStateResult', logStateResultHandler);
  }, []);

  const submitStateResults = async () => {
    const result:any = [name, votesBiden, votesTrump, stateSeats];
    const tx = await usElectionContract.submitStateResult(result);

    setTxHash(tx.hash);
    setTransactionPending(1);

    await tx.wait();

    setTransactionPending(2);

    resetForm();
  }

  const resetForm = async () => {
    setName('');
    setVotesBiden(0);
    setVotesTrump(0);
    setStateSeats(0);
  }

  return (
    <div className="results-form">
    <p>
      Biden seats: {seatsBiden} - Trump seats: {seatsTrump}
    </p>
    <p>
      Current Leader is: {currentLeader}
    </p>
    <form>
      <label>
        State:
        <input onChange={stateInput} value={name} type="text" name="state" />
      </label>
      <label>
        BIDEN Votes:
        <input onChange={bideVotesInput} value={votesBiden} type="number" name="biden_votes" />
      </label>
      <label>
        TRUMP Votes:
        <input onChange={trumpVotesInput} value={votesTrump} type="number" name="trump_votes" />
      </label>
      <label>
        Seats:
        <input onChange={seatsInput} value={stateSeats} type="number" name="seats" />
      </label>
      {/* <input type="submit" value="Submit" /> */}
    </form>
    <div className="button-wrapper">
      <button onClick={submitStateResults}>Submit Results</button>
    </div>
    <div className="loading-component" hidden={transactionPending == 0}>
      <h2>Submitting Results</h2>
      <p>Your transaction hash is <a href={"https://rinkeby.etherscan.io/tx/" + txHash} id="txHashSpan" target="_blank">{txHash}</a>.</p>
      <div hidden={transactionPending != 1}>
        <p>Results submitted. Please wait while the blockchain validates and approves your transaction.</p>
        <p>This can take a few minutes.</p>
        <div className="lds-dual-ring"></div>
      </div>
      <div hidden={transactionPending != 2}>
        <p>Results successfuly submitted.</p>
      </div>
    </div>
    <style jsx>{`
        .results-form {
          display: flex;
          flex-direction: column;
        }

        .button-wrapper {
          margin: 20px;
        }
        

        .lds-dual-ring {
          display: inline-block;
          width: 80px;
          height: 80px;
        }
        .lds-dual-ring:after {
          content: " ";
          display: block;
          width: 64px;
          height: 64px;
          margin: 8px;
          border-radius: 50%;
          border: 6px solid #000;
          border-color: #000 transparent #000 transparent;
          animation: lds-dual-ring 1.2s linear infinite;
        }
        @keyframes lds-dual-ring {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
      `}</style>
    </div>
  );
};

export default USLibrary;
