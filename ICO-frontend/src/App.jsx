import { useState,useEffect } from 'react'
import Web3 from "web3";
import './App.css'
import {address,abi} from'./contracts/ICO.json'

function App() {
  const [accounts,setAccounts] = useState(null)
  const [contract,setContract] = useState(null)
  const [web3,setWeb3] = useState(null)
  const [raisedAmount,setRaisedAmount] = useState(0)
  const [value,setValue] = useState(0)
  const [lockBalance,setLockBalance] = useState(0)
  
  useEffect(() => {
    (async function () {
      await loadWeb3();
    })();
  }, []);
  
  async function loadWeb3() {
    if (window.ethereum) {
      try {
        let web3 = new Web3(window.ethereum)
        setWeb3(web3)
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccounts(accounts[0]);
        console.log("abi,address",abi,address)
        let ICO = new web3.eth.Contract(abi,address)
        console.log(ICO)
        setContract(ICO)
        let raisedAmount = await ICO.methods.raisedAmount().call()
        console.log(raisedAmount)
        let lockBalance = await ICO.methods.lockBalance(accounts[0]).call()
        console.log(lockBalance)
        setRaisedAmount(web3.utils.fromWei(raisedAmount,"ether"))
        setLockBalance(web3.utils.fromWei(lockBalance,"ether"))

      } catch (error) {
        console.log(error);
      }
    }
  }

  async function invest(){
    let gasPrice = await web3.eth.getGasPrice()
    console.log("gasPrice",gasPrice)
    
    let gas = await contract.methods.invest().estimateGas({from:accounts,value:web3.utils.toWei(value.toString(),"ether")})
    console.log('gas',gas.toString());
    const nonce = await web3.eth.getTransactionCount(accounts);

    await contract.methods.invest()
    .send({
      from:accounts,
      to:address,
      gas,
      gasPrice,
      nonce,
      value:web3.utils.toWei(value.toString(),"ether")
    })
  }

 

  return (
    <>
    <p>{accounts}</p>
      <h1>ICO</h1>
      <div>
        <p>Raise Amount:{raisedAmount}</p>
        <p>your contribution:{lockBalance}</p>
        <input type='number' placeholder='Enter investment amount' onChange={(e)=>setValue(e.target.value)}/>
      </div>
      <div className="card">
        <button onClick={invest}>
          invest
        </button>
       
      </div>
      <p className="read-the-docs">
        Invest at your own risk
      </p>
    </>
  )
}

export default App
