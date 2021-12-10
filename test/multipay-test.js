const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Multipay", function () {

  var erc20token
  var multipay
  var owner
  var user1
  var user2

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners()

    const MockedERC20Token = await ethers.getContractFactory("MockedERC20Token")
    erc20Token = await MockedERC20Token.deploy(10000000)
    await erc20Token.deployed()

    const Multipay = await ethers.getContractFactory("Multipay")
    multipay = await Multipay.deploy()
    await multipay.deployed()

    await erc20Token.transfer(multipay.address, 100000)
  })

  it("Should pay recipients as specified", async function () {
    await multipay.transferMany(erc20Token.address, [
      {recipient: user1.address, amount: 100},
      {recipient: user2.address, amount: 200}
    ])

    expect(await erc20Token.balanceOf(user1.address)).to.be.equal(100)
    expect(await erc20Token.balanceOf(user2.address)).to.be.equal(200)
  })

  it("Should not pay more than the balance", async function () {
    await expect(multipay.transferMany(erc20Token.address, [
      {recipient: user1.address, amount: 100000},
      {recipient: user2.address, amount: 200}
    ])).to.be.revertedWith("ERC20: transfer amount exceeds balance")

    expect(await erc20Token.balanceOf(user1.address)).to.be.equal(0)
    expect(await erc20Token.balanceOf(user2.address)).to.be.equal(0)
  })
})
