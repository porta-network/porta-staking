// SPDX-License-Identifier: Unlicense

// IPortaStake.sol -- Porta Staking Interface

pragma solidity ^0.8.0;

// @title PortaStake Interface
// @author Alisina Bahadori
interface IPortaStake {

    /*---------------------*\
    |  Interface functions  |
    \*---------------------*/

    // @notice Stakes amount of token into the contract.
    // @param amount How much of the fungible token to deposit for staking.
    function depositStake(uint256 amount) external;

    // @notice Withdraws staked amount from the contract.
    // @param amount How much of the fungible token to unstake.
    function withdrawStake(uint256 amount) external;

    // @notice Calculates the unclaimed reward for an owner.
    // @param owner Address of the stake owner to calculate rewards for.
    // @return unclaimedReward The amount of reward which is not yet claimed.
    function calculateReward(address owner)
        external
        view
        returns (uint256 unclaimedReward);

    // @notice Returns the stake lock status for an owner.
    // @param owner Address of the stake owner to fetch lock status for.
    // @return lockedUntil The minimum time when withdrawal is possible.
    function lockStatus(address owner)
        external
        view
        returns (uint256 lockedUntil);

    /*--------*\
    |  Events  |
    \*--------*/

    // @notice When the stake amount for an owner is changed.
    event StakeChange(address indexed owner, uint256 amount);
}
