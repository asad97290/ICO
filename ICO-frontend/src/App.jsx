import { useState, useEffect } from "react";
import Web3 from "web3";
import "./App.css";
import { address, abi } from "./contracts/ICO.json";
import Token from "./contracts/Token.json";
import axios from "axios"
function App() {
  const [accounts, setAccounts] = useState(null);
  const [contract, setContract] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [raisedAmount, setRaisedAmount] = useState(0);
  const [value, setValue] = useState(0);
  const [lockBalance, setLockBalance] = useState(0);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [txData, setTxData] = useState([]);

  useEffect(() => {
    (async function () {
      await loadWeb3();
    })();
  }, []);

  async function loadWeb3() {
    if (window.ethereum) {
      try {
        let web3 = new Web3(window.ethereum);
        setWeb3(web3);
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccounts(accounts[0]);
        console.log("abi,address", abi, address);
        let ICO = new web3.eth.Contract(abi, address);
        let TokenContract = new web3.eth.Contract(Token.abi, Token.address);
        console.log(ICO);
        setContract(ICO);
        let wei = await TokenContract.methods.balanceOf(accounts[0]).call()
        console.log("wei",wei)
        let bal = web3.utils.fromWei(wei,"ether")
        setTokenBalance(bal)
        let raisedAmount = await ICO.methods.raisedAmount().call();
        console.log(raisedAmount);
        let lockBalance = await ICO.methods.contributions(accounts[0]).call();
        console.log(lockBalance.amount);
        setRaisedAmount(web3.utils.fromWei(raisedAmount, "ether"));
        setLockBalance(web3.utils.fromWei(lockBalance.amount, "ether"));
        let {data} = await axios.get(`http://localhost:3333/api/v1/getTxDetails/${accounts[0]}`)
        setTxData(data.data)
        console.log(data.data)
      } catch (error) {
        console.log(error);
      }
    }
  }

  async function invest() {
    try {
      let gasPrice = await web3.eth.getGasPrice();
      console.log("gasPrice", gasPrice);

      let gas = await contract.methods
        .invest()
        .estimateGas({
          from: accounts,
          value: web3.utils.toWei(value.toString(), "ether"),
        });
      console.log("gas", gas.toString());
      const nonce = await web3.eth.getTransactionCount(accounts);

      await contract.methods
        .invest()
        .send({
          from: accounts,
          to: address,
          gas,
          gasPrice,
          nonce,
          value: web3.utils.toWei(value.toString(), "ether"),
        })
        .on("transactionHash", (tx) => {
          console.log(tx);
        })
        .on("receipt", async (receipt) => {
          console.log(receipt);
          console.log({   transactionHash:receipt.transactionHash,
            investment:value,
            address:accounts
          });
          await axios.post("http://localhost:3333/api/v1/saveTxData",{
            transactionHash:receipt.transactionHash,
            investment:value,
            address:accounts
          })
        });
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <>
      <p>{accounts}</p>
      <h1>ICO</h1>
      <div>
        <p>Raise Amount:{raisedAmount} ETH</p>
        <p>your contribution:{lockBalance} ETH</p>
        <p>Token Balance:{tokenBalance} </p>
        <input
          type="number"
          placeholder="Enter investment amount"
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <div className="card">
        <button onClick={invest}>invest</button>
      </div>
      <ul>
        {txData.map((i,index)=>(

        <li key={index}>  
          <a href={`https://sepolia.arbiscan.io/tx/${i.transactionHash}`}>Tx Hash</a>
          <div>{i.address}</div> 
          <div>{i.investment} ETH</div> 
        </li>
        ))}
      </ul>
    </>
  );
}

export default App;
