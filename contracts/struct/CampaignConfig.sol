// SPDX-License-Identifier: Unlicense

// CampaignConfig.sol -- Struct for holding campaign configuration

pragma solidity ^0.8.0;

struct CampaignConfig {
    // APR of active campaign.
    uint256 apr;
    // How many tokens should be given away in case of max contribution.
    uint256 maxTokens;
    // When the campaign start and deposits can begin.
    uint256 startAt;
    // When campaign ends.
    uint256 endAt;
    // For how much time will the initial stake of address get locked.
    uint256 minStakeDuration;
    // Maximum number of tokens that can be staked per address.
    uint256 maxStakePerAddress;
    // Minimum number of tokens that can be staked per address.
    uint256 minStakePerAddress;
}


