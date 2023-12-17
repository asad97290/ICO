// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./ICOToken.sol";
import "hardhat/console.sol";
import "./utils/Errors.sol";

/**
 * @title ICO Smart Contract
 * @dev A smart contract for conducting an Initial Coin Offering (ICO)
 */
contract ICO is AccessControl {
    uint256 public closeTime;
    uint256 public startTime;
    uint256 public rate;
    uint256 public softCap;
    uint256 public hardCap;
    uint256 public raisedAmount;
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    ICOToken public token;
    // struct for investment 
    struct Investment{
        uint256 amount;
        uint256 tokenAmount;
    }
    // Mapping to track the contributions of each address
    mapping(address => Investment) public contributions;

    event Withdrawal(address account, uint256 ethAmount);
    event Invest(address account, uint256 ethAmount,uint256 tokenAmount);
    event Claim(address account, uint256 tokenAmount);

    /**
     * @dev Constructor to initialize ICO parameters
     * @param _startTime Start time of the ICO
     * @param _closeTime Close time of the ICO
     * @param _softCap Soft cap for the ICO
     * @param _hardCap Hard cap for the ICO
     * @param _token Address of the ICO token
     * @param _rate Rate of the ICO token in ETH
     */
    constructor(
        uint256 _startTime,
        uint256 _closeTime,
        uint256 _softCap,
        uint256 _hardCap,
        uint256 _rate,
        ICOToken _token
    ) payable {
        if (block.timestamp > _closeTime) {
            revert CommanErrors.WrongEndTime();
        }
        if (_closeTime < _startTime) {
            revert CommanErrors.WrongStartTime();
        }
        if (_hardCap < _softCap) {
            revert CommanErrors.WrongCap();
        }
        if (address(_token) == address(0)) {
            revert CommanErrors.ZeroAddress();
        }
        if (_rate == 0) {
            revert CommanErrors.ZeroAmount();
        }
        _grantRole(OWNER_ROLE, msg.sender);
        _grantRole(OWNER_ROLE, address(this));


        startTime = _startTime;
        closeTime = _closeTime;
        softCap = _softCap;
        hardCap = _hardCap;
        rate = _rate;
        token = _token;
    }

  


    /**
     * @dev Function to allow investors to contribute funds to the ICO
     */
    function invest() external payable {
        //cache msgValue 
        uint256 amount = msg.value;

        // Revert if the investment amount is zero
        if (amount == 0) {
            revert CommanErrors.ZeroAmount();
        }
    
        // can not invest amount exceeding hard cap
        if (amount > hardCap) {
            revert CommanErrors.HardCapExceed();
        }
        
        // check if raised amount greter then hardcap
        if(raisedAmount > hardCap){
            revert CommanErrors.HardCapExceed();
        }

        uint256 timestamp = block.timestamp;
        address sender = msg.sender;

        // can not invest after closing time
        if (timestamp > closeTime) {
            revert CommanErrors.CanNotInvestAfterClosing();
        }
        // can not invest before start time
        if (timestamp < startTime) {
            revert CommanErrors.CanNotInvestBeforeStart();
        }
    
        // calculate tokens 
        uint256 tokenAmount = ( amount / rate ) * 1 ether;

        //check if the contract have enough tokens
        if(tokenAmount > token.balanceOf(address(this))){
            revert CommanErrors.NotEnoughTokens();
        }
        // cache contribution object
        Investment memory investObj = contributions[sender];

        // Add the investment amount against the address
        unchecked {
            contributions[sender] = Investment({
                amount:amount+investObj.amount,
                tokenAmount:tokenAmount+investObj.tokenAmount
            });
            raisedAmount += amount;
        }
  
        // check if the soft cap is reached and tansfer token directly to investor    
        if(raisedAmount >= softCap){
            uint256 lockBal = contributions[sender].tokenAmount;
            contributions[sender].tokenAmount = 0;
            token.transfer(sender, lockBal);

            // Emit the Claim event
            emit Claim(sender, lockBal);
        }


        // Emit the Invest event
        emit Invest(sender, amount,tokenAmount);
    }



    /**
     * @dev Function for claiming tokens
     */
    function claimToken() external {
        //cache msgSender 
        address sender = msg.sender;


        // ICO contract balance
        uint256 balance = contributions[sender].tokenAmount;
        // check if the soft cap is reached
        if (raisedAmount < softCap) {
            revert CommanErrors.SoftCapNotReached();
        }

        // check if the contract balance is zero
        if (balance == 0) {
            revert CommanErrors.NoInvestment();
        }

        // mark contribution to zero to prevent reentrancy
        contributions[sender].tokenAmount = 0;
        // trasnfer Tokens
        token.transfer(sender, balance);

        // emit claim event 
        emit Claim(sender, balance);

    }


    /**
     * @dev Function for the owner to withdraw funds from the ICO contract
     */
    function withdraw() external onlyRole(OWNER_ROLE) {
        // only valid after unlock time (closing time)
        if (block.timestamp < closeTime) {
            revert CommanErrors.NotOpen();
        }

        // ICO contract balance
        uint256 balance = address(this).balance;
        //cache msgSender
        address sender = msg.sender;
        // check if the soft cap is reached
        if (balance < softCap) {
            revert CommanErrors.SoftCapNotReached();
        }

        // check if the contract balance is zero
        if (balance == 0) {
            revert CommanErrors.WithdrawFailed();
        }

        // Transfer the contract balance to the owner
        (bool success, ) = payable(sender).call{value: balance}("");
        // check if the transfer is successful
        if (!success) revert CommanErrors.TransferFailed();

        // Emit the Withdrawal event
        emit Withdrawal(sender, balance);
    }



    function userWithdraw() external{
        // only valid after unlock time (closing time)
        if (block.timestamp < closeTime) {
            revert CommanErrors.NotOpen();
        }
        address sender = msg.sender;

         // check if the soft cap is reached
        if (raisedAmount >= softCap) {
            revert CommanErrors.SoftCapReached();
        }
        // get investmnet object
        Investment storage lockBal = contributions[sender];
        uint256 amount = lockBal.amount;

        // check if eth amount is zero
        if (amount == 0) {
            revert CommanErrors.WithdrawFailed();
        }
        // mark amount to zero to prevent reentrancy
        lockBal.amount = 0;
        // Transfer the contract balance to the owner
        (bool success, ) = payable(sender).call{value: amount}("");

        // check if the transfer is successful
        if (!success) revert CommanErrors.TransferFailed();  
        // emit withdraw event
        emit Withdrawal(sender, amount); 
    }

    /**
     * @dev Function for the owner to change the ICO token price
     * @param newPrice New price of the ICO token in ETH
     */
    function changePrice(uint256 newPrice) external  onlyRole(OWNER_ROLE){
        // check if the new price is zero
        if (newPrice == 0) {
            revert CommanErrors.ZeroAmount();
        }

        rate = newPrice;
    }


    /**
     * @dev Function for the owner to change the ICO token address
     * @param newTokenAddress Address of the new ICO token
     */
    function changeTokenAddress(ICOToken newTokenAddress) external onlyRole(OWNER_ROLE) {
        token = newTokenAddress;
    }

    /**
     * @dev Function for the owner to change the ICO hard cap
     * @param newHardCap New hard cap for the ICO
     */
    function changeHardCap(uint256 newHardCap) external  onlyRole(OWNER_ROLE) {
        hardCap = newHardCap;
    }

    /**
     * @dev Function for the owner to change the ICO soft cap
     * @param newSoftCap New soft cap for the ICO
     */
    function changeSoftCap(uint256 newSoftCap) external  onlyRole(OWNER_ROLE) {
        softCap = newSoftCap;
    }


    /**
     * @dev Function for the owner to change the closing time
     * @param newCloseTime New closing time for the ICO
     */
    function changeCloseTime(uint256 newCloseTime) external  onlyRole(OWNER_ROLE) {
        closeTime = newCloseTime;
    }


    /**
     * @dev Function for the owner to change the starting time
     * @param newStartTime New starting time for the ICO
     */
    function changeStartTime(uint256 newStartTime) external  onlyRole(OWNER_ROLE) {
        startTime = newStartTime;
    }

    /**
     * @dev Fallback function to receive funds
     */
    receive() external payable {}
}
