const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PortaStake", function () {

  var portaStake
  var portaStakeHub
  var erc20Token
  var owner
  var user

  beforeEach(async function() {
    [owner, user] = await ethers.getSigners()

    const MockedERC20Token = await ethers.getContractFactory("MockedERC20Token")
    erc20Token = await MockedERC20Token.deploy(10000000)
    await erc20Token.deployed()

    const PortaStakeHub = await ethers.getContractFactory("PortaStakeHub")
    portaStakeHub = await PortaStakeHub.deploy(erc20Token.address)
    await portaStakeHub.deployed()

    await erc20Token.transfer(portaStakeHub.address, 10000)

    const PortaStake = await ethers.getContractFactory("PortaStake")
    await portaStakeHub.newCampaign(
      // APR
      5000,
      // Max Tokens
      10000,
      // Start of staking
      tomorrow(),
      // End of staking
      tomorrow() + days(20),
      // Minimum stake duration per wallet
      days(1),
      // Minimum stake amount per wallet
      100,
      // Maximum stake amount per wallet
      500000
    )

    portaStakeAddresses = await portaStakeHub.listVaults()
    portaStake = PortaStake.attach(portaStakeAddresses[0])
  })

  it("Should not allow deposits without active campaigns", async function () {
    await expect(portaStake.depositStake(10000)).to.be
      .revertedWith("PortaStake: Cannot deposit in deactivated campaign.")
  })

  it("Deposit in active campaign", async function () {
    await erc20Token.approve(portaStake.address, 10000000)

    var snapId = await ethers.provider.send('evm_snapshot');
    await ethers.provider.send('evm_increaseTime', [days(1)]);
    await ethers.provider.send('evm_mine');

    await portaStake.depositStake(10000);

    await ethers.provider.send('evm_increaseTime', [days(10)]);
    await ethers.provider.send('evm_mine');

    expect(await portaStake.liveReward(owner.address)).to.be.equal(136);

    await ethers.provider.send('evm_increaseTime', [hours(4)]);
    await ethers.provider.send('evm_mine');

    expect(await portaStake.liveReward(owner.address)).to.be.equal(139);

    await ethers.provider.send('evm_revert', [snapId])
  })

  it("Can claim rewards after 6PM GMT", async function () {
    await erc20Token.approve(portaStake.address, 10000000)

    var snapId = await ethers.provider.send('evm_snapshot');
    await ethers.provider.send('evm_increaseTime', [days(1)]);
    await ethers.provider.send('evm_mine');

    await portaStake.depositStake(10000);

    await ethers.provider.send('evm_increaseTime', [days(10)]);
    await ethers.provider.send('evm_mine');

    const liveReward = await portaStake.liveReward(owner.address)
    const claimableReward = await portaStake.claimableReward(owner.address)

    expect(liveReward).to.be.equal(136);
    expect(claimableReward).to.be.below(liveReward);

    const beforeClaimBalance = await erc20Token.balanceOf(owner.address)
    await portaStake.claimReward();
    const claimedAmount =
      await erc20Token.balanceOf(owner.address) - beforeClaimBalance

    expect(claimedAmount).to.be.equal(claimableReward);

    await ethers.provider.send('evm_revert', [snapId])
  })

  it("Can withdraw only after minimum stake duration", async function () {
    await erc20Token.approve(portaStake.address, 10000000)

    var snapId = await ethers.provider.send('evm_snapshot');
    await ethers.provider.send('evm_increaseTime', [days(1)]);
    await ethers.provider.send('evm_mine');

    await portaStake.depositStake(10000);

    await ethers.provider.send('evm_increaseTime', [hours(23)]);
    await ethers.provider.send('evm_mine');

    await expect(portaStake.withdrawStake(10000)).to.be.revertedWith('PortaStake: Minimum stake duration not satisfied');

    await ethers.provider.send('evm_increaseTime', [hours(24)]);
    await ethers.provider.send('evm_mine');

    const reward = await portaStake.claimableReward(owner.address)
    expect(reward).to.be.above(0);

    const beforeClaimBalance = await erc20Token.balanceOf(owner.address)
    await portaStake.withdrawStake(10000);

    expect(await erc20Token.balanceOf(owner.address)).to
      .equal(beforeClaimBalance.add(10000).add(reward));

    await ethers.provider.send('evm_revert', [snapId])

  })
});

function tomorrow() {
  return Math.floor(now() / 1000) + days(1)
}

function now() {
  return Date.now()
}

function days(n) {
  return n * 86400
}

function hours(n) {
  return n * 3600
}
