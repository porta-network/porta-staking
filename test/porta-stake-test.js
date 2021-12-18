const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PortaStake", function () {

  var PortaStake
  var portaStake
  var portaStakeHub
  var erc20Token
  var owner
  var user
  var snapShotId

  beforeEach(async function() {
    [owner, user] = await ethers.getSigners()

    snapShotId = await ethers.provider.send('evm_snapshot');

    const currentBlock = await ethers.provider.getBlock(await currentBlockNumber())
    const REWARD_START = 1632679200
    var toDate = new Date(REWARD_START * 1000)

    while(toDate < currentBlock.timestamp * 1000) {
      toDate = new Date(toDate.getTime() + 86400 * 1000)
    }

    const diffToReward = (toDate - currentBlock.timestamp * 1000) / 1000

    await ethers.provider.send('evm_increaseTime', [diffToReward - hours(6)]);
    await ethers.provider.send('evm_mine');

    const MockedERC20Token = await ethers.getContractFactory("MockedERC20Token")
    erc20Token = await MockedERC20Token.deploy(10000000)
    await erc20Token.deployed()

    const PortaStakeHub = await ethers.getContractFactory("PortaStakeHub")
    portaStakeHub = await PortaStakeHub.deploy(erc20Token.address)
    await portaStakeHub.deployed()

    await erc20Token.transfer(portaStakeHub.address, 10000)

    PortaStake = await ethers.getContractFactory("PortaStake")
    await portaStakeHub.newCampaign("The title",
      // APR
      5000,
      // Max Tokens
      10000,
      // Start of staking
      await tomorrow(),
      // End of staking
      await tomorrow() + days(20),
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

  afterEach(async function() {
    await ethers.provider.send('evm_revert', [snapShotId])
    await ethers.provider.send('evm_mine');
  })


  it("Should return campaign config", async function () {
    const config = await portaStake.campaignConfig()
    expect(config[0]).to.be.eq("The title")
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
    expect(claimableReward.reward).to.be.at.most(liveReward);

    const lockedUntil = await portaStake.lockedUntil(owner.address)

    const beforeClaimBalance = await erc20Token.balanceOf(owner.address)
    await portaStake.claimReward();
    const claimedAmount =
      await erc20Token.balanceOf(owner.address) - beforeClaimBalance

    expect(claimedAmount).to.be.equal(claimableReward.reward);

    const newLiveReward = await portaStake.liveReward(owner.address)
    expect(newLiveReward).to.be.equal(liveReward - claimedAmount)

    const newLockedUntil = await portaStake.lockedUntil(owner.address)
    expect(newLockedUntil).to.be.equal(lockedUntil)

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

    const claimableReward = await portaStake.claimableReward(owner.address)
    expect(claimableReward.reward).to.be.above(0);

    const beforeClaimBalance = await erc20Token.balanceOf(owner.address)
    await portaStake.withdrawStake(10000);

    expect(await erc20Token.balanceOf(owner.address)).to
      .equal(beforeClaimBalance.add(10000).add(claimableReward.reward));

    await ethers.provider.send('evm_revert', [snapId])
  })

  it("Can withdraw after campaign ends", async function () {
    await portaStakeHub.newCampaign("The title",
      // APR
      5000,
      // Max Tokens
      10000,
      // Start of staking
      await tomorrow(),
      // End of staking
      await tomorrow() + days(4),
      // Minimum stake duration per wallet
      days(3),
      // Minimum stake amount per wallet
      100,
      // Maximum stake amount per wallet
      500000
    )

    portaStakeAddresses = await portaStakeHub.listVaults()
    portaStake = PortaStake.attach(portaStakeAddresses[1])

    await erc20Token.approve(portaStake.address, 10000000)

    var snapId = await ethers.provider.send('evm_snapshot');
    await ethers.provider.send('evm_increaseTime', [days(3)]);
    await ethers.provider.send('evm_mine');

    await portaStake.depositStake(10000);

    await ethers.provider.send('evm_increaseTime', [days(2)]);
    await ethers.provider.send('evm_mine');

    await portaStake.withdrawStake(10000);
  })

  it('Can get account info via accountInfo function', async function () {
    await erc20Token.approve(portaStake.address, 10000000)

    var snapId = await ethers.provider.send('evm_snapshot');
    await ethers.provider.send('evm_increaseTime', [days(1)]);
    await ethers.provider.send('evm_mine');

    await portaStake.depositStake(10000);

    var accountInfo = await portaStake.accountInfo(owner.address);

    expect(accountInfo.stakeAmount).to.be.equal(10000)
    expect(accountInfo.claimableRewardAmount).to.be.equal(0)
    expect(accountInfo.liveRewardAmount).to.be.equal(0)
    expect(accountInfo.unlocksAt).to.be.above(days(1) - 60)

    await ethers.provider.send('evm_increaseTime', [days(3)]);
    await ethers.provider.send('evm_mine');

    accountInfo = await portaStake.accountInfo(owner.address);

    expect(accountInfo.stakeAmount).to.be.equal(10000)
    expect(accountInfo.claimableRewardAmount).to.be.equal(30)
    expect(accountInfo.liveRewardAmount).to.be.equal(41)
    expect(accountInfo.unlocksAt).to.be.below(await now())

    await ethers.provider.send('evm_increaseTime', [days(25)]);
    await ethers.provider.send('evm_mine');

    accountInfo = await portaStake.accountInfo(owner.address);

    expect(accountInfo.stakeAmount).to.be.equal(10000)
    expect(accountInfo.claimableRewardAmount).to.be.equal(273)
    expect(accountInfo.liveRewardAmount).to.be.equal(273)
    expect(accountInfo.unlocksAt).to.be.below(await now())

    await ethers.provider.send('evm_revert', [snapId])
  })

  it('Can withdraw excess amount only by the owner', async function () {
    await erc20Token.approve(portaStake.address, 10000000)

    var snapId = await ethers.provider.send('evm_snapshot');
    await ethers.provider.send('evm_increaseTime', [days(1)]);
    await ethers.provider.send('evm_mine');

    await portaStake.depositStake(100);

    const vaultBalance = await erc20Token.balanceOf(portaStake.address);

    await ethers.provider.send('evm_increaseTime', [days(30)]);

    await expect(portaStake.connect(user).finalWithdraw()).to.be
      .revertedWith('Ownable: caller is not the owner');

    await portaStake.finalWithdraw();

    expect(await erc20Token.balanceOf(portaStake.address)).to.be
      .within(100, vaultBalance);

    await ethers.provider.send('evm_revert', [snapId])
  })

  it('Will not let new deposits after max tokens reached', async function () {
    await erc20Token.approve(portaStake.address, 10000000)

    var snapId = await ethers.provider.send('evm_snapshot');
    await ethers.provider.send('evm_increaseTime', [days(1)]);
    await ethers.provider.send('evm_mine');

    await expect(portaStake.depositStake(10001)).to.be
      .revertedWith('PortaStake: Campaign max tokens reached!');

    await portaStake.depositStake(10000);

    await expect(portaStake.depositStake(1)).to.be
      .revertedWith('PortaStake: Campaign max tokens reached!');

    await ethers.provider.send('evm_revert', [snapId])
  })

  it('Cannot deposit in deactivated campaign', async function () {
    await erc20Token.approve(portaStake.address, 10000000)

    await expect(portaStake.depositStake(100)).to.be
      .revertedWith('PortaStake: Cannot deposit in deactivated campaign.');

    var snapId = await ethers.provider.send('evm_snapshot');
    await ethers.provider.send('evm_increaseTime', [days(1)]);
    await ethers.provider.send('evm_mine');

    await portaStake.depositStake(100);

    await ethers.provider.send('evm_increaseTime', [days(30)]);

    await expect(portaStake.depositStake(100)).to.be
      .revertedWith('PortaStake: Cannot deposit in deactivated campaign.');

    await ethers.provider.send('evm_revert', [snapId])
  })
});

async function tomorrow() {
  return Math.floor(await await now()) + days(1)
}

async function currentBlockNumber() {
  var blockNumber = await ethers.provider.getBlockNumber()
  var currentBlock = await ethers.provider.getBlock(blockNumber)

  while (currentBlock == null) {
    blockNumber--;
    currentBlock = await ethers.provider.getBlock(blockNumber)
  }

  return blockNumber
}

async function now() {
  const currentBlock = await ethers.provider.getBlock(await currentBlockNumber())

  return currentBlock.timestamp
}

function days(n) {
  return n * 86400
}

function hours(n) {
  return n * 3600
}
