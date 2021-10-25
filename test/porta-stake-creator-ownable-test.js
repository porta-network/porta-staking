const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PortaStake CreatorOwnable", function () {

  var portaStakeHub
  var portaStake
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
    await portaStakeHub.newCampaign("The title", 5000, 10000, tomorrow(), tomorrow() + 24 * 60 * 60, 24 * 60 * 60, 0, 500000)
    portaStakeAddresses = await portaStakeHub.listVaults()
    portaStake = PortaStake.attach(portaStakeAddresses[0])
  })

  it("Owner should be same as the hub owner", async function () {
    expect(await portaStake.owner()).to.be.equal(await portaStakeHub.owner());

    await portaStakeHub.transferOwnership(user.address)

    expect(await portaStakeHub.owner()).to.be.equal(user.address)
    expect(await portaStake.owner()).to.be.equal(user.address)
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
