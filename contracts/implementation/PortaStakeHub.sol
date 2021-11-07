// SPDX-License-Identifier: AGPL-3.0-or-later

// PortaStakeHub.sol -- Porta Staking Management Contract

pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "../interface/IPortaStakeHub.sol";
import "../struct/CampaignConfig.sol";
import "../implementation/PortaStake.sol";
import "../utils/PortaUtils.sol";

// @title PortaStakeHub Contract
// @author Alisina Bahadori
contract PortaStakeHub is IPortaStakeHub, PortaUtils, Ownable {

    /*---------*\
    |  Storage  |
    \*---------*/

    IERC20 internal _stakeToken;
    address[] private _vaults;

    constructor(address stakeToken) {
        _stakeToken = IERC20(stakeToken);
    }

    /*------------------*\
    |  Admin Operations  |
    \*------------------*/

    function adminWithdraw(uint256 amount) external override onlyOwner {
        require(_stakeToken.transfer(owner(), amount));
        emit AdminWithdraw(msg.sender, amount);
    }

    function newCampaign(
        string memory title,
        uint256 apr,
        uint256 maxTokens,
        uint256 startAt,
        uint256 endAt,
        uint256 minStakeDuration,
        uint256 minStakePerAddress,
        uint256 maxStakePerAddress
    ) external override onlyOwner returns (address stakeContractAddress) {
        PortaStake portaStake = new PortaStake(
            title,
            address(_stakeToken),
            apr,
            maxTokens,
            startAt,
            endAt,
            minStakeDuration,
            minStakePerAddress,
            maxStakePerAddress);

        uint256 maxReward = rewardAt(maxTokens, startAt, endAt, apr, endAt);

        // For better error handling
        require(maxReward <= stakeTokenBalance(), "PortaStakeHub: Insufficient tokens for campaign");
        require(_stakeToken.transfer(address(portaStake), maxReward));

        _vaults.push(address(portaStake));

        emit CampaignCreate(address(portaStake));

        return address(portaStake);
    }

    function listVaults() external override view returns (address[] memory vaults) {
        return _vaults;
    }

    function stakeTokenBalance() public view returns (uint256 balance) {
        return _stakeToken.balanceOf(address(this));
    }
}
