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
  const PortaStakeHub = await hre.ethers.getContractFactory("PortaStakeHub")
  const portaStakeHub = await PortaStakeHub.attach(process.env.PORTA_STAKE_HUB)

  await portaStakeHub.transferOwnership(process.env.NEW_OWNER)

  console.log("Owner is", await portaStakeHub.owner())
}

function now() {
  return Math.floor(Date.now() / 1000);
}

function wei(amount) {
  return ethers.BigNumber.from(ethers.utils.parseEther(amount.toString()))
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
