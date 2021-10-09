// SPDX-License-Identifier: Unlicense

// PortaStake.sol -- Porta Staking Contract

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../implementation/CreatorOwnable.sol";
import "../interface/IPortaStake.sol";
import "../struct/CampaignConfig.sol";
import "../struct/StakeHolderInfo.sol";
import "../utils/PortaUtils.sol";

// @title PortaStake Contract
// @author Alisina Bahadori
contract PortaStake is IPortaStake, PortaUtils, CreatorOwnable {

    /*-----------*\
    |  Constants  |
    \*-----------*/

    uint256 constant REWARD_START = 1632679200;
    uint256 constant REWARD_INTERVAL = 1 days;
    IERC20 internal _stakeToken;
    CampaignConfig public campaignConfig;

    /*---------*\
    |  Storage  |
    \*---------*/

    // @notice Information of stake holders
    mapping(address => StakeHolderInfo) public _stakeHolderInfo;
    uint256 internal _lockedTokens = 0;
    uint256 public campaignStakedTokens = 0;

    constructor(
        address stakeToken,
        uint256 apr,
        uint256 maxTokens,
        uint256 startAt,
        uint256 endAt,
        uint256 minStakeDuration,
        uint256 minStakePerAddress,
        uint256 maxStakePerAddress
    ) {
        _stakeToken = IERC20(stakeToken);

        require(startAt > block.timestamp,
                "PortaStake: CampaignStart should be greater than CurrentTime");
        require(endAt - 1 days >= startAt,
                "PortaStake: CampaignEnd should be greater than its start by at least a day");
        require(apr > 0, "PortaStake: APR should be greater than zero");
        require(maxStakePerAddress >= minStakePerAddress, "PortaStake: Bad Min/Max configuration.");
        require(maxStakePerAddress > 0, "PortaStake: Max Address Stake should be greater than 0");

        campaignConfig.apr = apr;
        campaignConfig.maxTokens = maxTokens;
        campaignConfig.startAt = startAt;
        campaignConfig.endAt = endAt;
        campaignConfig.minStakeDuration = minStakeDuration;
        campaignConfig.minStakePerAddress = minStakePerAddress;
        campaignConfig.maxStakePerAddress = maxStakePerAddress;
    }

    /*--------------------*\
    |  Staking Operations  |
    \*--------------------*/

    function depositStake(uint256 amount) public override {
        require(isCampaignActive(),
                "PortaStake: Cannot deposit in deactivated campaign.");

        StakeHolderInfo storage shi = _stakeHolderInfo[msg.sender];

        // Unlock all tokens temporarily
        _lockedTokens -= endWithdrawAmount(shi);

        // Add the stake to the users vault
        shi.stakeAmount += amount;
        shi.lastTimestamp = block.timestamp;

        // Add to total staked tokens
        campaignStakedTokens += amount;
        // Lock the new total reward for user
        _lockedTokens += endWithdrawAmount(shi);

        require(campaignStakedTokens <= campaignConfig.maxTokens,
                "PortaStake: Campaign max tokens reached!");
        require(shi.stakeAmount <= campaignConfig.maxStakePerAddress,
                "PortaStake: Maximum address stake limit reached");
        require(shi.stakeAmount >= campaignConfig.minStakePerAddress,
                "PortaStake: Minimum address stake not satisfied");

        // Transfer tokens from user
        require(_stakeToken.transferFrom(msg.sender, address(this), amount));

        emit StakeChange(msg.sender, shi.stakeAmount);
    }

    function withdrawStake(uint256 amount) public override {
        StakeHolderInfo storage shi = _stakeHolderInfo[msg.sender];
        require(shi.stakeAmount > 0, "PortaStake: Insufficient balance");
        require(shi.lastTimestamp + campaignConfig.minStakeDuration <= block.timestamp,
                "PortaStake: Minimum stake duration not satisfied!");

        if (isCampaignActive()) {
            // Claim the rewards for the user before withdraw
            if(claimReward() > 0)
                // Reload the stake holder info
                shi = _stakeHolderInfo[msg.sender];
        }


        require(amount <= shi.stakeAmount, "PortaStake: Insufficient balance");

        // Unlock all tokens temporarily
        _lockedTokens -= endWithdrawAmount(shi);

        // Remove the stake from users vault
        shi.stakeAmount -= amount;
        shi.lastTimestamp = block.timestamp;

        // Lock the new total reward for user
        _lockedTokens += endWithdrawAmount(shi);
        campaignStakedTokens -= amount;

        require(shi.stakeAmount == 0 || shi.stakeAmount >= campaignConfig.minStakePerAddress,
                "PortaStake: Minimum address stake not satisfied");
        require(_stakeToken.transfer(msg.sender, amount));

        emit StakeChange(msg.sender, shi.stakeAmount);
    }

    function claimReward() public override returns (uint256 claimedReward) {
        require(isCampaignActive(),
                "PortaStake: Claim works for active campaign. Use withdraw after campaign ends");

        uint256 claimableAmount = claimableReward(msg.sender);

        if (claimableAmount > 0) {
            StakeHolderInfo storage shi = _stakeHolderInfo[msg.sender];

            shi.lastTimestamp = block.timestamp;
            _lockedTokens -= claimableAmount;

            require(_stakeToken.transfer(msg.sender, claimableAmount));

            emit RewardClaim(msg.sender, claimableAmount);
        }

        return claimableAmount;
    }

    function finalWithdraw() external override onlyOwner {
        require(campaignConfig.endAt < block.timestamp, "PortaStake: Campaign is still running");

        uint256 amount = availableTokens();
        require(_stakeToken.transfer(owner(), amount));
        emit FinalWithdraw(msg.sender, amount);
    }

    /*----------------*\
    |  View Functions  |
    \*----------------*/

    function liveReward(address owner)
        public
        view
        override
        returns (uint256)
    {
        StakeHolderInfo memory shi = _stakeHolderInfo[owner];
        return rewardAt(
            shi.stakeAmount,
            shi.lastTimestamp,
            block.timestamp,
            campaignConfig.apr,
            campaignConfig.endAt
        );
    }

    function claimableReward(address owner)
        public
        view
        override
        returns (uint256)
    {
        StakeHolderInfo memory shi = _stakeHolderInfo[owner];

        uint256 applicable_rounds = (block.timestamp - REWARD_START) / REWARD_INTERVAL;
        uint256 applicable_timestamp = REWARD_START + applicable_rounds * REWARD_INTERVAL;

        return rewardAt(
          shi.stakeAmount,
          shi.lastTimestamp,
          applicable_timestamp,
          campaignConfig.apr,
          campaignConfig.endAt
        );
    }

    function endWithdrawAmount(StakeHolderInfo memory shi) internal view returns (uint256) {
        // Reward + Initial Stake
        return rewardAt(
                shi.stakeAmount,
                shi.lastTimestamp,
                campaignConfig.endAt,
                campaignConfig.apr,
                campaignConfig.endAt
        ) + shi.stakeAmount;
    }

    function lockedUntil(address owner)
        public
        view
        override
        returns (uint256)
    {
        StakeHolderInfo memory shi = _stakeHolderInfo[owner];
        return shi.lastTimestamp + campaignConfig.minStakeDuration;
    }

    function availableTokens() public view returns (uint256 amount) {
        return _stakeToken.balanceOf(address(this)) - _lockedTokens;
    }

    function isCampaignActive() public view override returns (bool isActive) {
        return campaignConfig.startAt <= block.timestamp && campaignConfig.endAt >= block.timestamp;
    }
}
