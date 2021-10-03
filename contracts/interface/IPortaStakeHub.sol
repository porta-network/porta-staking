// SPDX-License-Identifier: Unlicense

// IPortaStakeHub.sol -- Porta Staking Administration Interface

pragma solidity ^0.8.0;

// @title PortaStake Interface
// @author Alisina Bahadori
interface IPortaStakeHub {
    /*---------------------*\
    |  Interface functions  |
    \*---------------------*/

    // @notice Withdraws tokens from the contract by an administrator.
    // @param amount How much of the fungible token to withdraw.
    function adminWithdraw(uint256 amount) external;

    // @notice Sets the active stacking campaign for the contract.
    // @param apr The annual reward percentage. 100% = 10000.
    // @param maxTokens Max amount of tokens in the stake pool.
    // @param startAt When the campaign will lock the funds and accept stakes.
    // @param endAt When the campaign releases the lock and stops rewarding.
    // @param minStakeDuration Minimum time required for stake to be withdraw-able.
    function newCampaign(
        uint256 apr,
        uint256 maxTokens,
        uint256 startAt,
        uint256 endAt,
        uint256 minStakeDuration,
        uint256 minStakePerAddress,
        uint256 maxStakePerAddress
    ) external returns (address campaignContract);

    // @notice Returns active campaign addresses.
    // @return isActive Determines if a campaign is activated.
    function listVaults() external view returns (address[] memory vaults);

    /*--------*\
    |  Events  |
    \*--------*/

    // @notice When an administrator withdraws an amount from the contract.
    event AdminWithdraw(address indexed admin, uint256 amount);

    // @notice When an administrator sets up a campaign for the contract.
    event CampaignCreate(address campaignContract);
}
