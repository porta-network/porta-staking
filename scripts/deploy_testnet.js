// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const onetoken = hre.ethers.BigNumber.from('1000000000000000000')
  const amount = hre.ethers.BigNumber.from(100000).mul(onetoken)

  const MockedERC20Token = await hre.ethers.getContractFactory("MockedERC20Token")
  erc20Token = await MockedERC20Token.deploy(amount)
  await erc20Token.deployed()

  const PortaStake = await hre.ethers.getContractFactory("PortaStake")
  portaStake = await PortaStake.deploy(erc20Token.address)
  await portaStake.deployed()


  await erc20Token.transfer(portaStake.address, hre.ethers.BigNumber.from(10000).mul(onetoken));

  console.log("PortaStake Deployed To:", portaStake.address);
  console.log("MockERC20 Deployed To:", erc20Token.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
