// SPDX-License-Identifier: AGPL-3.0-or-later

// PortaUtils.sol -- Helper functions for porta staking framework.

pragma solidity ^0.8.0;

abstract contract PortaUtils {
    uint256 constant PERCENT = 10000;
    uint256 constant APR_DURATION = 365 days;

    // @notice Calculates the stake reward at a given point in time.
    function rewardAt(
        uint256 stakedAmount,
        uint256 startAt,
        uint256 endAt,
        uint256 apr,
        uint256 campaignEndAt
    )
        public
        pure
        returns (uint256)
    {
        if (startAt > endAt)
            return 0;
        if (endAt > campaignEndAt)
            endAt = campaignEndAt;

        return stakedAmount * (endAt - startAt) * apr / APR_DURATION / PERCENT;
    }
}
