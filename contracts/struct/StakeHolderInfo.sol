// SPDX-License-Identifier: AGPL-3.0-or-later

// StakeHolderInfo.sol -- Struct for stake holder information

pragma solidity ^0.8.0;

struct StakeHolderInfo {
    // When was the last change to the stake.
    uint256 lastTimestamp;
    // How much is the current stake.
    uint256 stakeAmount;
    // When will the stake get unlocked.
    uint256 lockedUntil;
}

