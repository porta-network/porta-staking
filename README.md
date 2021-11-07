# Porta Staking

This project has the porta staking contract implementation in solidity.

![example workflow](https://github.com/porta-network/porta-staking/actions/workflows/hardhat_ci.yaml/badge.svg)

## How to run the tests

Currently you can run the tests with.

```
npm i
npx hardhat test
```

## Deployment and campaign creation

After deploying the `PortaStakeHub` contract to the network, You can start creating campaigns.

In order to create a campaign you will need to send some tokens to the contract.
Let's say you want to create a new contract from 10th of December until the end of 15th of December
with an APR of 50% and max stakable tokens of 1000. (Max Stakable Tokens: Maximum amount of staked tokens in any moment in the contract)

If you need to calculate how much tokens you will need for this you can either use the `rewardAt` function in the hub or even use the below formula.

```
MAX_STAKABLE_TOKENS * NUMBER_OF_DAYS * APR / 36500
```

So in our example this would be:

```
1000 * 6 * 50 / 36500 = 8.2192
```

This would be the least amount that the hub contract needs to create the campaign.

## Components

 - [`PortaStakeHub.sol`](contracts/implementation/PortaStakeHub.sol): Is the main deployable contract which creates and holds a list of staking vaults.
 - [`PortaStake.sol`](contracts/implementation/PortaStake.sol): Is the vault implementation. It will be deployed by the hub on campaign creation.
 - [`PortaUtils.sol`](contracts/utils/PortaUtils.sol): Is the shared functions to use between the hub and the vault.
 - [`CreatorOwnable.sol`](contracts/implementation/CreatorOwnable.sol): Makes the creator of the contract the inherited owner. This means that the owner of the creator contract will also be the owner of this contract.
 - [`MockedERC20Token.sol`](contracts/mock/MockedERC20Token.sol): A simple ERC20 token with a faucet. (For testing)
 - [`interface`](contracts/interface): Interfaces of contracts which is useful in integrations.
 - [`struct`](contracts/struct): Structures of data for the hub and vault contracts.

## Integration

You can access the contract json abi in the `data/abi` directory. Also in case
that you want to integrate it with another contract you can use the `IPortaStake.sol`
and `IPortaStakeHub.sol` files.

## LICENSE

[AGPL 3.0](LICENSE) - GNU AFFERO GENERAL PUBLIC LICENSE
