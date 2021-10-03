const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PortaStakeHub", function () {

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
  })

  it("Should accept campaign setup from administrator", async function () {
    await erc20Token.transfer(portaStakeHub.address, 10000)

    const campaignContract = await portaStakeHub.newCampaign(5000, 10000, tomorrow(), tomorrow() + 24 * 60 * 60, 24 * 60 * 60, 0, 500000)
  });

  it("Should not accept campaign setup with insufficient balance", async function () {
    await expect(portaStakeHub.newCampaign(5000, 10000, tomorrow(), tomorrow() + 24 * 60 * 60, 24 * 60 * 60, 0, 100)).to.be.revertedWith('PortaStakeHub: Insufficient tokens for campaign')
  });

  it("Should let admin to withdraw all the amount left in the contract", async function() {
    await erc20Token.transfer(portaStakeHub.address, 10200)

    await portaStakeHub.adminWithdraw(100)

    await portaStakeHub.newCampaign(10000, 10000, tomorrow(), tomorrow() + 365 * 24 * 60 * 60, 24 * 60 * 60, 0, 1000)

    await portaStakeHub.adminWithdraw(100)
    await expect(portaStakeHub.adminWithdraw(100)).to.be.revertedWith("ERC20: transfer amount exceeds balance")
  });

  it("Non administrators should not be able to set campaigns or withdraw from the contract", async function() {
    await erc20Token.transfer(portaStakeHub.address, 10000)

    await expect(portaStakeHub.connect(user).adminWithdraw(100)).to.be.revertedWith("Ownable: caller is not the owner")
  });

  it("Admin should be able to transfer his/her permissions", async function() {
    await portaStakeHub.transferOwnership(user.address)

    await erc20Token.transfer(portaStakeHub.address, 10000)

    expect(await portaStakeHub.owner()).to.be.equal(user.address);
    await portaStakeHub.connect(user).adminWithdraw(100)
  });

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
