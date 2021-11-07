// SPDX-License-Identifier: AGPL-3.0-or-later

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

    // @notice Returns account information for dapps. This function should not
    // be used internally or by smart contracts as it consumes lots of gas.
    // @param owner The account address to get the info for.
    // @return stakeAmount the amount of staked tokens.
    // @return claimableReward amount of reward available to claim.
    // @return liveReward total amount of reward at this point in time.
    // @return lockedUntil Until when the withdrawal is locked for the owner.
    function accountInfo(address owner)
        external
        view
        returns (
            uint256 stakeAmount,
            uint256 claimableRewardAmount,
            uint256 liveRewardAmount,
            uint256 unlocksAt
        );

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
