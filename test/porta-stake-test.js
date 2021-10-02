const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PortaStake", function () {

  var portaStake
  var erc20Token
  var owner
  var user

  beforeEach(async function() {
    [owner, user] = await ethers.getSigners()

    const MockedERC20Token = await ethers.getContractFactory("MockedERC20Token")
    erc20Token = await MockedERC20Token.deploy(10000000)
    await erc20Token.deployed()

    const PortaStake = await ethers.getContractFactory("PortaStake")
    portaStake = await PortaStake.deploy(erc20Token.address)
    await portaStake.deployed()

    await erc20Token.approve(portaStake.address, 10000000)
  })

  it("Should not allow deposits without active campaigns", async function () {
    await expect(portaStake.depositStake(10000)).to.be.revertedWith("PortaStake: Cannot deposit in deactivated campaign.")
  })

  it("Deposit in active campaign", async function () {
    await erc20Token.transfer(portaStake.address, 10000)

    await portaStake.setupCampaign(5000, 10000, tomorrow(), tomorrow() + days(100), days(1), 10000)

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
