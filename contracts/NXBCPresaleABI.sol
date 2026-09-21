// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface NXBCPresaleABI {
    function buyTokens(uint256 usdtAmount) external;
    function currentPhase() external view returns (uint256);
    function currentPhasePrice() external view returns (uint256);
    function currentPhaseAllocation() external view returns (uint256);
    function currentPhaseSold() external view returns (uint256);
    function currentPhaseRemaining() external view returns (uint256);
    function totalSold() external view returns (uint256);
    function remainingPresaleSupply() external view returns (uint256);
    function presaleNXBCBalance() external view returns (uint256);
    function presaleActive() external view returns (bool);
    function owner() external view returns (address);
    function adminWallet() external view returns (address);
}
