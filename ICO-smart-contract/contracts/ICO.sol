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
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");

    uint public closeTime;
    uint public startTime;
    uint public rate;
    uint public softCap;
    uint public hardCap;
    uint public raisedAmount;
    ICOToken public token;
    address[] public investors;
    bool public goalReached;

    // Mapping to track the locked balance of each address
    mapping(address => uint) public lockBalance;

    event Withdrawal(address account, uint amount);
    event Invest(address account, uint amount);

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
        uint _startTime,
        uint _closeTime,
        uint _softCap,
        uint _hardCap,
        ICOToken _token,
        uint _rate
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
     * @dev Check if an address is already an investor
     * @param investor Address to check
     * @return True if the address is an investor, false otherwise
     */
    function isInvestor(address investor) private view returns (bool) {
        for (uint i = 0; i < investors.length; i++) {
            if (investors[i] == investor) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Function to allow investors to contribute funds to the ICO
     */
    function invest() external payable {
        uint amount = msg.value;

        // Revert if the investment amount is zero
        if (amount == 0) {
            revert CommanErrors.ZeroAmount();
        }


        uint timestamp = block.timestamp;
        address sender = msg.sender;
        // can not invest after closing time
        if (timestamp > closeTime) {
            revert CommanErrors.CanNotInvestAfterClosing();
        }
        // can not invest before start time
        if (timestamp < startTime) {
            revert CommanErrors.CanNotInvestBeforeStart();
        }
        // can not invest amount exceeding hard cap
        if (amount > hardCap) {
            revert CommanErrors.HardCapExceed();
        }

        uint256 tokenAmount = amount / rate;
        if(tokenAmount > token.balanceOf(address(this))){
            revert CommanErrors.NotEnoughTokens();
        }
    

        // Add the investment amount against the address
        unchecked {
            lockBalance[sender] += amount;
            raisedAmount +=amount;
        }
        // Add the investor to the array if not already added
        if (!isInvestor(sender)) {
            investors.push(sender);
        }

        if(goalReached){
            uint lockBal = lockBalance[sender];
            token.transfer(sender, lockBal / rate);
        }else if(address(this).balance >= softCap){
            goalReached = true;
            distribution();
        }

        // Emit the Invest event
        emit Invest(sender, amount);
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
        uint balance = address(this).balance;
        address sender = msg.sender;
        // check if the soft cap is reached
        if (balance < softCap) {
            revert CommanErrors.SoftCapNotReached();
        }

        // check if the contract balance is zero
        if (balance == 0) {
            revert CommanErrors.AlreadyWithdrawn();
        }

        // Transfer the contract balance to the owner
        (bool success, ) = payable(sender).call{value: balance}("");
        if (!success) revert CommanErrors.TransferFailed();

        // Emit the Withdrawal event
        emit Withdrawal(sender, balance);
    }



    function userWithdraw() external{
        // only valid after unlock time (closing time)
        if (block.timestamp < closeTime) {
            revert CommanErrors.NotOpen();
        }
        uint balance = address(this).balance;
        address sender = msg.sender;

         // check if the soft cap is reached
        if (balance >= softCap) {
            revert CommanErrors.SoftCapReached();
        }

        uint lockBal = lockBalance[sender];
        if (lockBal == 0) {
            revert CommanErrors.YouAreNotInvestor();
        }
        // Transfer the contract balance to the owner
        (bool success, ) = payable(sender).call{value: lockBal}("");
        if (!success) revert CommanErrors.TransferFailed();  
        emit Withdrawal(sender, lockBal); 
    }

    /**
     * @dev Function for the owner to change the ICO token price
     * @param newPrice New price of the ICO token in ETH
     */
    function changePrice(uint newPrice) external  onlyRole(OWNER_ROLE){
        // check if the new price is zero
        if (newPrice == 0) {
            revert CommanErrors.ZeroAmount();
        }

        rate = newPrice;
    }

    /**
     * @dev Function for the owner to distribute tokens to investors
     */
    function distribution() private {
        uint len = investors.length;
        for (uint i; i < len; ) {
            address investor = investors[i];
            uint lockBal = lockBalance[investor];
            if (lockBal != 0) {
                token.transfer(investor, lockBal / rate);
                lockBalance[investor] = 0;
            }
            unchecked {
                i = i + 1;
            }
        }
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
    function changeHardCap(uint newHardCap) external  onlyRole(OWNER_ROLE) {
        hardCap = newHardCap;
    }

    /**
     * @dev Function for the owner to change the ICO soft cap
     * @param newSoftCap New soft cap for the ICO
     */
    function changeSoftCap(uint newSoftCap) external  onlyRole(OWNER_ROLE) {
        softCap = newSoftCap;
    }

    /**
     * @dev Fallback function to receive funds
     */
    receive() external payable {}
}
