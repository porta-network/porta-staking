// SPDX-License-Identifier: Unlicense

// StakeHolderInfo.sol -- Struct for stake holder information

pragma solidity ^0.8.0;

struct StakeHolderInfo {
    // When was the last change to the stake.
    uint256 lastTimestamp;
    // How much is the current stake.
    uint256 stakeAmount;
}

