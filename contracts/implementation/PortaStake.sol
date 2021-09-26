// SPDX-License-Identifier: Unlicense

// PortaStake.sol -- Porta Staking Contract

pragma solidity ^0.8.0;

import "../interface/IPortaStake.sol";
import "../struct/StakeHolderInfo.sol";
import "./PortaAdmin.sol";

// @title PortaStake Contract
// @author Alisina Bahadori
contract PortaStake is IPortaStake, PortaAdmin {

    /*-----------*\
    |  Constants  |
    \*-----------*/

    uint256 constant REWARD_START = 1632679200;
    uint256 constant REWARD_INTERVAL = 1 days;
    uint256 constant PERCENT = 10000;

    /*---------*\
    |  Storage  |
    \*---------*/

    // @notice Information of stake holders
    mapping(address => StakeHolderInfo) public _stakeHolderInfo;
    uint256 internal _lockedTokens = 0;

    constructor(address stakeToken) {
        _stakeToken = IERC20(stakeToken);
    }

    /*--------------------*\
    |  Staking Operations  |
    \*--------------------*/

    function depositStake(uint256 amount) public override {
        require(isCampaignActive(), "PortaStake: Cannot deposit in deactivated campaign.");
        require(campaignStakedTokens + amount <= _campaignConfig.maxTokens, "PortaStake: Campaign Max Tokens Reached!");
        //resetPreviousCampaign();
        require(_stakeHolderInfo[msg.sender].stakeAmount + amount <= _campaignConfig.maxStakePerAddress, "PortaStake: Max Address Stake Reached");


        StakeHolderInfo storage shi = _stakeHolderInfo[msg.sender];
        shi.stakeAmount += amount;
        shi.lastTimestamp = block.timestamp;
        shi.endWithdrawAmount = shi.stakeAmount + calculateRewardAt(shi.stakeAmount, shi.lastTimestamp, _campaignConfig.endAt, _campaignConfig.apr);

        require(_stakeToken.transferFrom(msg.sender, address(this), amount));
        emit StakeChange(msg.sender, shi.stakeAmount);
    }

    function withdrawStake(uint256 amount) public override {}

    function calculateReward(address owner)
        public
        view
        override
        returns (uint256 unclaimedReward)
    {
        StakeHolderInfo memory shi = _stakeHolderInfo[owner];
        return calculateRewardAt(shi.stakeAmount, shi.lastTimestamp, block.timestamp, _campaignConfig.apr);
    }

    function calculateRewardAt(uint256 stakedAmount, uint256 startAt, uint256 endAt, uint256 apr) public pure returns (uint256 reward) {
        uint256 stakedTime = endAt - startAt;
        return stakedAmount * stakedTime * apr / 365 days / PERCENT;
    }

    function lockStatus(address owner)
        public
        view
        override
        returns (uint256 lockedUntil)
    {
        return 0;
    }

    function resetPreviousCampaign() internal {
        return;
        StakeHolderInfo memory shi = _stakeHolderInfo[msg.sender];

        if (shi.stakeAmount > 0 && shi.lastTimestamp < _campaignConfig.startAt) {
            shi.stakeAmount = 0;
            shi.lastTimestamp = 0;
            _stakeToken.transfer(msg.sender, shi.endWithdrawAmount);
        }
    }

    function _withdraw(address owner, uint256 amount) internal {
    }

    function availableTokens() public override view returns (uint256 amount) {
        return _stakeToken.balanceOf(address(this)) - _lockedTokens;
    }
}
