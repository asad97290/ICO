// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev This smart contract defines custom errors that can be thrown during specific conditions in other contracts.
 */

library CommanErrors{

    error OnlyAdmin();                 // Error thrown when a function is called by a non-administrator.
    error ZeroAmount();                // Error thrown when an operation involves an amount less than or equal to zero.
    error TransferAlreadyProcessed();  // Error thrown when attempting to process a transfer that has already been executed.
    error TransferFailed();            // Error thrown when a fund transfer operation fails.
    error ZeroAddress();               // Error thrown when address is equal to zero address.
    error NotOpen();                   // Error thrown when current time is before unlock time.
    error AlreadyWithdrawn();          // Error thrown when ico balance already withdrawn.
    error WrongEndTime();              // Error thrown when input wrogn end time for ICO.
    error InvalidAmount();             // Error thrown when input investment amount is invalid.
    error WrongStartTime();            // Error thrown when input investment amount is invalid.
    error WrongCap();                  // Error thrown when input investment amount is invalid.
    error CanNotInvestBeforeStart();   // Error thrown when input investment amount is invalid.
    error CanNotInvestAfterClosing();  // Error thrown when input investment amount is invalid.
    error HardCapExceed();             // Error thrown when input investment amount is invalid.
    error SoftCapNotReached();         // Error thrown when input investment amount is invalid.
    error YouAreNotInvestor();         // Error thrown when input investment amount is invalid.
    error SoftCapReached();         // Error thrown when input investment amount is invalid.
    error NotEnoughTokens();         // Error thrown when input investment amount is invalid.

}