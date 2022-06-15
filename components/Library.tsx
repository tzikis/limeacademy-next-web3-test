import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import useLibraryContract from "../hooks/useLibraryContract";

import {
  BigNumber,
  BigNumberish,
} from "ethers";


type LibContract = {
  contractAddress: string;
};

export enum Leader {
  UNKNOWN,
  BIDEN,
  TRUMP
}


const Library = ({ contractAddress }: LibContract) => {
  const { account, library } = useWeb3React<Web3Provider>();
  const libraryContract = useLibraryContract(contractAddress);
  const [booksList, setBooksList] = useState<Object[]>([]);
  const [addBookName, setAddBookName] = useState<string | undefined>();
  const [addBookCopies, setAddBookCopies] = useState<number | undefined>();

  const [txHash, setTxHash] = useState<string>('Unknown');

  const [transactionPending, setTransactionPending] = useState<number>(0);

  const [warningMessage, setWarningMessage] = useState<string>('');

  var booksListConst: any = [];

  useEffect(() => {
    getBooksList();
  },[])

  const getBooksList = async () => {
    const listBooks = await libraryContract.listBooks();
    // console.log(listBooks);
    const booksList = listBooks[0];
    const booksHashes = listBooks[1];

    const myBooksList: any = [];

    for(let i = 0; i< booksList.length; i++ ){
      myBooksList[i] = {"name": booksList[i][0], "copies": booksList[i][1], "rented": booksList[i][2], "hash": booksHashes[i]}
    }
    // console.log(myBooksList);
    booksListConst = myBooksList;
    setBooksList(myBooksList);

    const borrowers = await libraryContract.listBooks();
  }

  const addBookNameInput = (input) => {
    setAddBookName(input.target.value)
  }

  const addBookCopiesInput = (input) => {
    setAddBookCopies(input.target.value)
  }


  const addedBookHandler = (bookId, name, numOfCopies, tx) => {
    // console.log(bookId);
    // console.log(name);
    // console.log(numOfCopies);
    // console.log(booksListConst);
    booksListConst.push({"name": name, "copies": numOfCopies, "rented": 0, "hash": bookId});
    setBooksList(booksListConst);
  };

  const newBorrowingHandler = (bookId, borrower, tx) => {

    for(let i = 0; i< booksListConst.length; i++ ){

      if(booksListConst[i]["hash"].toHexString() == bookId.toHexString())
      {
        // console.log("FOUND");
        // console.log(booksListConst[i]["name"])
        booksListConst[i]["rented"] = booksListConst[i]["rented"] + 1;
        break;
      }
    }
    setBooksList([]);
    setBooksList(booksListConst);
  };

  const newReturnHandler = (bookId, borrower, tx) => {

    for(let i = 0; i< booksListConst.length; i++ ){

      if(booksListConst[i]["hash"].toHexString() == bookId.toHexString())
      {
        // console.log("FOUND");
        // console.log(booksListConst[i]["name"])
        booksListConst[i]["rented"] = booksListConst[i]["rented"] - 1;
        break;
      }
    }
    setBooksList([]);
    setBooksList(booksListConst);
  };


  useEffect(() => {
    libraryContract.on('AddedBook', addedBookHandler);
    libraryContract.on('NewBorrowing', newBorrowingHandler);
    libraryContract.on('NewReturn', newReturnHandler);
  }, []);

  const addBook = async () => {

    setWarningMessage("");

    try{
      const tx = await libraryContract.addBook(addBookName, addBookCopies);

      setTxHash(tx.hash);
      setTransactionPending(1);
  
      await tx.wait();
  
      setTransactionPending(2);
  
      resetForm();  
    }
    catch (error) {
      console.log(error);
      console.error(error);
      setWarningMessage("Sorry, we couldn't do that. An error occured");
    }

  }

  const resetForm = async () => {
    setAddBookName('');
    setAddBookCopies(0);
  }

  const rentBook = async (hash) => {

    setWarningMessage("");

    try{
      const tx = await libraryContract.borrowBook(hash);

      setTxHash(tx.hash);
      setTransactionPending(1);
      await tx.wait();
      setTransactionPending(2);
  
    }
    catch (error) {
      console.log(error)
      console.error(error)
      setWarningMessage("Sorry, we couldn't do that. An error occured");
    }

  }

  const returnBook = async (hash) => {

    setWarningMessage("");

    // console.log(hash)

    try{
      const tx = await libraryContract.returnBook(hash);

      setTxHash(tx.hash);
      setTransactionPending(1);
      await tx.wait();
      setTransactionPending(2);
  
    }
    catch (error) {
      console.log(error)
      console.error(error)
      setWarningMessage("Sorry, we couldn't do that. An error occured");
    }

  }


  return (
    <div className="results-form">
    {/* <p>
      Biden seats: {seatsBiden} - Trump seats: {seatsTrump}
    </p>
    <p>
      Current Leader is: {currentLeader}
    </p>
    <div>Elections are : {electionEnded? "Closed": "Open"}</div> */}
    {/* <div hidden={electionEnded == 1}> */}
      <h2>Add Book:</h2>
      <form>
        <label>
          Book Name:
          <input onChange={addBookNameInput} value={addBookName} type="text" name="add_book_name" />
        </label>
        <label>
          Number of Copies:
          <input onChange={addBookCopiesInput} value={addBookCopies} type="number" name="add_book_copies" />
        </label>
      </form>
      <div className="button-wrapper">
        <button onClick={addBook}>Add Book</button>
      </div>
      <li>
      {booksList.map(({ name, copies, rented, hash }) => (
        <ul key={name+copies+rented}> <b>{name}</b> - Copies: {copies}, Rented: {rented}, Available: {copies-rented} {copies-rented>0? <button onClick={() => {rentBook(hash)}}>Rent</button>: null} <button onClick={() => {returnBook(hash)}}>Return</button></ul>
      ))}
      </li>
  
      <div className="button-wrapper">
        <button onClick={rentBook}>End Election</button>
      </div>
      <p>{warningMessage}</p>
    {/* </div> */}
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

export default Library;
