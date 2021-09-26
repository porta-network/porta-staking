// SPDX-License-Identifier: Unlicense

// PortaAdmin.sol -- Porta Staking Management Contract

pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "../interface/IPortaAdmin.sol";
import "../struct/CampaignConfig.sol";

// @title PortaAdmin Contract
// @author Alisina Bahadori
abstract contract PortaAdmin is IPortaAdmin, Ownable {

    /*---------*\
    |  Storage  |
    \*---------*/

    IERC20 internal _stakeToken;
    CampaignConfig public _campaignConfig;
    uint256 campaignStakedTokens = 0;

    /*------------------*\
    |  Admin Operations  |
    \*------------------*/

    function adminWithdraw(uint256 amount) external override onlyOwner {
        require(!isCampaignActive(), "PortaAdmin: Cannot withdraw with active campaign");
        require(_campaignConfig.endAt < block.timestamp, "PortaAdmin: Cannot withdraw with planned campaign");
        require(availableTokens() >= amount, "PortaAdmin: Insufficient amount");

        _stakeToken.transfer(owner(), amount);
    }

    function setupCampaign(
        uint256 apr,
        uint256 maxTokens,
        uint256 startAt,
        uint256 endAt,
        uint256 minStakeDuration,
        uint256 maxStakePerAddress
    ) external override onlyOwner {
        require(!isCampaignActive(), "PortaAdmin: Cannot Edit Active Campaign");
        require(startAt > block.timestamp, "PortaAdmin: CampaignStart should be greater than CurrentTime");
        require(endAt - 1 days >= startAt, "PortaAdmin: CampaignEnd should be greater than its start by at least a day");
        require(maxTokens <= availableTokens(), "PortaAdmin: Insufficient tokens for campaign");
        require(maxStakePerAddress > 0, "PortaAdmin: Max Address Stake should be greater than 0");
        require(apr > 0, "PortaAdmin: APR should be greater than zero");

        _campaignConfig.apr = apr;
        _campaignConfig.maxTokens = maxTokens;
        _campaignConfig.startAt = startAt;
        _campaignConfig.endAt = endAt;
        _campaignConfig.minStakeDuration = minStakeDuration;
        _campaignConfig.maxStakePerAddress = maxStakePerAddress;
        campaignStakedTokens = 0;
    }

    function isCampaignActive() public view override returns (bool isActive) {
        return _campaignConfig.startAt <= block.timestamp && _campaignConfig.endAt >= block.timestamp;
    }

    /*----------------*\
    |  Abstract Calls  |
    \*----------------*/

    function availableTokens() public virtual view returns (uint256 amount);
}
