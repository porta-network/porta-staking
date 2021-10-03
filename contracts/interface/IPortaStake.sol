// SPDX-License-Identifier: Unlicense

// IPortaStake.sol -- Porta Staking Interface

pragma solidity ^0.8.0;

// @title PortaStake Interface
// @author Alisina Bahadori
interface IPortaStake {
    /*---------*\
    |  Actions  |
    \*---------*/

    // @notice Stakes amount of token into the contract.
    // @param amount How much of the fungible token to deposit for staking.
    function depositStake(uint256 amount) external;

    // @notice Withdraws staked amount from the contract.
    // @param amount How much of the fungible token to unstake.
    function withdrawStake(uint256 amount) external;

    // @notice Claims the claimable reward for the sender.
    function claimReward() external returns (uint256 claimedReward);

    // @notice Withdraws all non-locked token only after the campaign ends.
    function finalWithdraw() external;

    /*-------*\
    |  Views  |
    \*-------*/

    // @notice Returns true if there is an active campaign.
    // @return isActive if the campaign is active.
    function isCampaignActive() external returns (bool isActive);

    // @notice Calculates the current reward for an owner. May not be claimable.
    // @param owner Address of the stake owner to calculate rewards for.
    // @return liveReward The amount live reward for address.
    function liveReward(address owner)
        external
        view
        returns (uint256 reward);

    // @notice Calculates the unclaimed reward for an owner.
    // @param owner Address of the stake owner to calculate rewards for.
    // @return claimableReward The amount of reward available to claim.
    function claimableReward(address owner)
        external
        view
        returns (uint256 reward);

    // @notice Returns the stake lock status for an owner.
    // @param owner Address of the stake owner to fetch lock status for.
    // @return lockedUntil The minimum time when withdrawal is possible.
    function lockedUntil(address owner)
        external
        view
        returns (uint256 unlocksAt);

    /*--------*\
    |  Events  |
    \*--------*/

    // @notice When the stake amount for an owner is changed.
    event StakeChange(address indexed owner, uint256 amount);

    // @notice When the reward is claimed for the user.
    event RewardClaim(address indexed owner, uint256 amount);

    // @notice When the reward is claimed for the user.
    event FinalWithdraw(address indexed owner, uint256 amount);
}
