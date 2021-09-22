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

    const PortaAdmin = await ethers.getContractFactory("PortaAdmin")
    portaAdmin = await PortaAdmin.deploy()
    await portaAdmin.deployed()
  })

  it("Should accept campaign setup from administrator", async function () {
    await erc20Token.transfer(portaAdmin.address, 10000)

    await portaAdmin.setupCampaign(5000, 10000, tomorrow(), tomorrow() + 24 * 60 * 60, 24 * 60 * 60)
  });

  it("Should not accept campaign setup with insufficient balance", async function () {
    await expect(portaAdmin.setupCampaign(5000, 10000, tomorrow(), tomorrow() + 24 * 60 * 60, 24 * 60 * 60)).to.be.revertedWith('PortaAdmin: Insufficient balance for the campaign!')
  });

  it("Should let admin to withdraw ONLY when there is no campaign running or planned", async function() {
    await erc20Token.transfer(portaAdmin.address, 10000)

    await portaAdmin.adminWithdraw(100)

    await portaAdmin.setupCampaign(5000, 10000, tomorrow(), tomorrow() + 24 * 60 * 60, 24 * 60 * 60)

    await expect(portaAdmin.adminWithdraw(100)).to.be.revertedWith("PortaAdmin: Cannot withdraw with planned or running campaign!")
  });

  it("Non administrators should not be able to set campaigns or withdraw from the contract", async function() {
    await erc20Token.transfer(portaAdmin.address, 10000)

    await expect(portaAdmin.connect(user).adminWithdraw(100)).to.be.revertedWith("Ownable: Only owner can make this request")
  });

  it("Admin should be able to transfer his/her permissions", async function() {
    await portaAdmin.transferOwnership(user.address)

    await erc20Token.transfer(portaAdmin.address, 10000)

    await portaAdmin.connect(user).adminWithdraw(100)
  });

});
