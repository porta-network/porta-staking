const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PortaAdmin", function () {

  var portaAdmin
  var erc20Token
  var owner
  var user

  beforeEach(async function() {
    [owner, user] = await ethers.getSigners()

    const MockedERC20Token = await ethers.getContractFactory("MockedERC20Token")
    erc20Token = await MockedERC20Token.deploy(10000000)
    await erc20Token.deployed()

    const PortaAdmin = await ethers.getContractFactory("PortaStake")
    portaAdmin = await PortaAdmin.deploy(erc20Token.address)
    await portaAdmin.deployed()
  })

  it("Should accept campaign setup from administrator", async function () {
    await erc20Token.transfer(portaAdmin.address, 10000)

    await portaAdmin.setupCampaign(5000, 10000, tomorrow(), tomorrow() + 24 * 60 * 60, 24 * 60 * 60, 500000)
  });

  it("Should not accept campaign setup with insufficient balance", async function () {
    await expect(portaAdmin.setupCampaign(5000, 10000, tomorrow(), tomorrow() + 24 * 60 * 60, 24 * 60 * 60, 0)).to.be.revertedWith('PortaAdmin: Insufficient tokens for campaign')
  });

  it("Should let admin to withdraw ONLY when there is no campaign running or planned", async function() {
    await erc20Token.transfer(portaAdmin.address, 10100)

    await portaAdmin.adminWithdraw(100)

    await portaAdmin.setupCampaign(5000, 10000, tomorrow(), tomorrow() + 24 * 60 * 60, 24 * 60 * 60, 1000)

    await expect(portaAdmin.adminWithdraw(100)).to.be.revertedWith("PortaAdmin: Cannot withdraw with planned campaign")

    var snapId = await ethers.provider.send('evm_snapshot');
    await ethers.provider.send('evm_increaseTime', [days(1)]);
    await ethers.provider.send('evm_mine');

    expect(await portaAdmin.isCampaignActive()).to.be.equal(true);

    await expect(portaAdmin.adminWithdraw(100)).to.be.revertedWith("PortaAdmin: Cannot withdraw with active campaign")
    await ethers.provider.send('evm_revert', [snapId]);
  });

  it("Non administrators should not be able to set campaigns or withdraw from the contract", async function() {
    await erc20Token.transfer(portaAdmin.address, 10000)

    await expect(portaAdmin.connect(user).adminWithdraw(100)).to.be.revertedWith("Ownable: caller is not the owner")
  });

  it("Admin should be able to transfer his/her permissions", async function() {
    await portaAdmin.transferOwnership(user.address)

    await erc20Token.transfer(portaAdmin.address, 10000)

    expect(await portaAdmin.owner()).to.be.equal(user.address);
    await portaAdmin.connect(user).adminWithdraw(100)
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
