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
  const PortaStake = await hre.ethers.getContractFactory("PortaStake")
  portaStake = await PortaStake.attach(process.env.PORTA_STAKE_ADDRESS)

  now = Math.floor(Date.now() / 1000)
  start = now + 60

  await portaStake.setupCampaign(5000, onetoken.mul(1000), start, start +  7 * 86400, 86400, onetoken.mul(100));

  console.log("Campaign Activated");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
