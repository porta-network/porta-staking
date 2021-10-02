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
        require(isCampaignActive(),
                "PortaStake: Cannot deposit in deactivated campaign.");
        require(campaignStakedTokens + amount <= _campaignConfig.maxTokens,
                "PortaStake: Campaign max tokens reached!");

        StakeHolderInfo storage shi = _stakeHolderInfo[msg.sender];

        require(shi.stakeAmount == 0 || shi.lastTimestamp >= _campaignConfig.startAt,
                "PortaStake: Previous campaign should be fully withdrawn first");
        require(shi.stakeAmount + amount <= _campaignConfig.maxStakePerAddress,
                "PortaStake: Max address stake limit reached");


        shi.stakeAmount += amount;
        campaignStakedTokens += amount;
        shi.lastTimestamp = block.timestamp;
        shi.endWithdrawAmount = endWithdrawAmount(shi);
        _lockedTokens += shi.endWithdrawAmount;

        require(_stakeToken.transferFrom(msg.sender, address(this), amount));

        emit StakeChange(msg.sender, shi.stakeAmount);
    }

    function withdrawStake(uint256 amount) public override {
        StakeHolderInfo storage shi = _stakeHolderInfo[msg.sender];
        require(shi.stakeAmount > 0, "PortaStake: Insufficient balance");

        if (!isCampaignActive() || shi.lastTimestamp < _campaignConfig.startAt) {
            // It was a previous campaign therefor the endWithdrawAmount
            // should be considered. And only ALL can be withdrawn.

            amount = shi.endWithdrawAmount;
            uint256 reward = amount - shi.stakeAmount;

            campaignStakedTokens -= shi.stakeAmount;
            shi.stakeAmount = 0;
            shi.lastTimestamp = block.timestamp;
            _lockedTokens -= shi.endWithdrawAmount;
            shi.endWithdrawAmount = 0;

            require(_stakeToken.transfer(msg.sender, amount));

            emit StakeChange(msg.sender, shi.stakeAmount);
            emit RewardClaim(msg.sender, reward);
        } else {
            // It is a participation to the active campaign.

            //claimReward();
            require(amount <= shi.stakeAmount, "PortaStake: Insufficient balance");

            campaignStakedTokens -= amount;
            shi.stakeAmount = shi.stakeAmount - amount;
            shi.lastTimestamp = block.timestamp;
            shi.endWithdrawAmount = endWithdrawAmount(shi);
            _lockedTokens += shi.endWithdrawAmount;

            require(_stakeToken.transfer(msg.sender, amount));

            emit StakeChange(msg.sender, shi.stakeAmount);
        }
    }

    function claimReward() public {
        require(isCampaignActive(),
                "PortaStake: Claim works for active campaign. Use withdraw after campaign ends");

        uint256 claimableReward = claimableReward(msg.sender);

        if (claimableReward > 0) {
            StakeHolderInfo storage shi = _stakeHolderInfo[msg.sender];

            shi.lastTimestamp = block.timestamp;
            shi.endWithdrawAmount = endWithdrawAmount(shi);
            _lockedTokens -= claimableReward;

            require(_stakeToken.transfer(msg.sender, claimableReward));

            emit RewardClaim(msg.sender, claimableReward);
        }
    }

    /*----------------*\
    |  View Functions  |
    \*----------------*/

    function liveReward(address owner)
        public
        view
        override
        returns (uint256 liveReward)
    {
        StakeHolderInfo memory shi = _stakeHolderInfo[owner];
        return calculateRewardAt(shi.stakeAmount, shi.lastTimestamp, block.timestamp);
    }

    function claimableReward(address owner)
        public
        view
        override
        returns (uint256 claimableReward)
    {
        StakeHolderInfo memory shi = _stakeHolderInfo[owner];

        uint256 applicable_rounds = (block.timestamp - REWARD_START) / REWARD_INTERVAL;
        uint256 applicable_timestamp = REWARD_START + applicable_rounds * REWARD_INTERVAL;

        return calculateRewardAt(
          shi.stakeAmount,
          shi.lastTimestamp,
          applicable_timestamp
        );
    }

    function calculateRewardAt(uint256 stakedAmount, uint256 startAt, uint256 endAt) public view returns (uint256 reward) {
        if (startAt > endAt) return 0;
        if (endAt > _campaignConfig.endAt) endAt = _campaignConfig.endAt;
        uint256 stakedTime = endAt - startAt;
        return stakedAmount * stakedTime * _campaignConfig.apr / 365 days / PERCENT;
    }

    function endWithdrawAmount(StakeHolderInfo memory shi) internal view returns (uint256 endAmount) {
        // Reward + Initial Stake
        return calculateRewardAt(
                shi.stakeAmount,
                shi.lastTimestamp,
                _campaignConfig.endAt
        ) + shi.stakeAmount;
    }

    function lockedUntil(address owner)
        public
        view
        override
        returns (uint256 lockedUntil)
    {
        return 0;
    }

    function availableTokens() public override view returns (uint256 amount) {
        return _stakeToken.balanceOf(address(this)) - _lockedTokens;
    }
}
