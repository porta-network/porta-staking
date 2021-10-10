# Porta Staking

This project has the porta staking contract implementation in solidity.

![example workflow](https://github.com/porta-network/porta-staking/actions/workflows/hardhat_ci.yaml/badge.svg)

**THIS Is Currently a WIP**

## How to run

Currently you can run the tests with.

```
npm i
npx hardhat test
```

TODO: How to deploy on ganache or hardhat node?


## Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.template file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/deploy.js
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```
