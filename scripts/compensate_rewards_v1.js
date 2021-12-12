// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const fs = require("fs");
const axios = require('axios');
const ethers = hre.ethers;

const TOKEN = '0x6e56b52438ef4badd6ae8ed2302ebe242fd58600'
const BATCH_SIZE = 16

var db

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  readDB()

  const multipayNetwork = process.env.MULTIPAY_NETWORK || "bsctestnet"

  hre.changeNetwork('bsc');
  const PortaStakeHub = await hre.ethers.getContractFactory("PortaStakeHub")
  const portaStakeHub = await PortaStakeHub.attach(process.env.PORTA_STAKE_HUB)

  hre.changeNetwork(multipayNetwork);
  const Multipay = await hre.ethers.getContractFactory("Multipay")
  const multipay = await Multipay.attach(process.env.MULTIPAY_ADDRESS)

  hre.changeNetwork('bscarchive');
  const PortaStake = await hre.ethers.getContractFactory("PortaStake")

  const vaults = await portaStakeHub.listVaults()

  console.log("Going for block" + db.currentHeight)

  while (true) {
    for (const vault of vaults) {
      console.log("vault", vault)
      const portaStake = PortaStake.attach(vault)
      const filter = portaStake.filters.RewardClaim()

      const events = await getEvents(vault, filter.topics[0], db.currentHeight, 'latest')
      console.log("Found " + events.result.length + " events")

      for (const rewardEvent of events.result) {
        const txHash = rewardEvent["transactionHash"]
        if(!(txHash in db.compensations)) {
          console.log("new transaction", txHash)
        }
        if(txHash in db.compensations) {
          continue
        }

        rewardEvent["vault"] = vault
        rewardEvent["isCompensated"] = false
        rewardEvent["from"] = '0x' + rewardEvent.topics[1].substr(2 + 64 - 40)
        db.compensations[txHash] = rewardEvent
      }

      saveDB()
      console.log("Cooling off API Limit...")
      await timer(5 * 1000)
    }

    uncompensated = Object.values(db.compensations)
      .filter(v => !v.isCompensated)

    hre.changeNetwork('bscarchive');

    uncompensated = await asyncFilter(uncompensated, async compensation => {
      const blockNumber = hexToNumber(compensation["blockNumber"])
      if(await multipay.isPaymentProcessed(compensation.from, blockNumber)) {
        db.compensations[compensation.transactionHash].isCompensated = true
        console.log("Already paid", compensation.from, blockNumber)
        return false
      }
      return true
    })

    for (const compensation of uncompensated) {
      if(compensation.reimbursment)
        continue;
      const blockNumber = hexToNumber(compensation["blockNumber"])

      const portaStake = await PortaStake.attach(compensation.vault)

      const liveRewardBefore =
        await portaStake.liveReward(
          compensation.from,
          {blockTag: blockNumber - 1}
        )

      const reimbursment =
        liveRewardBefore.sub(
          ethers.BigNumber.from(compensation.data)
        )

      console.log("Reimbursment amount", reimbursment.toString(), "for", compensation.from)

      db.compensations[compensation.transactionHash]["reimbursment"] = reimbursment;
    }

    saveDB()

    hre.changeNetwork(multipayNetwork);

    const batchCount = uncompensated.length / BATCH_SIZE

    for(var i = 0; i <= batchCount; i++) {
      const slice = uncompensated.splice(0, BATCH_SIZE)
      if (slice.length === 0) break;

      const toCompensate =
        slice.map(c => {
          const blockNumber = hexToNumber(c["blockNumber"])

          return {
            amount: c.reimbursment,
            recipient: c.from,
            payReference: blockNumber
          }
        })

      console.log("compensating", slice.length)

      await multipay.transferMany(TOKEN, toCompensate);

      for (const c of slice) {
        db.compensations[c.transactionHash].isCompensated = true
      }

      saveDB();

      console.log("compensated successfully")
    }

    console.log("Sleeping...")
    await timer(12 * 60 * 60 * 1000)

  }
}

function readDB() {
  if(fs.existsSync("db.json")) {
    data = fs.readFileSync("db.json", 'utf-8')
    db = JSON.parse(data)
  } else {
    db = {
      currentHeight: 12673820,
      compensations: {}
    }
  }
}

function saveDB() {
  console.log("DB Saved")
  fs.writeFileSync("db.json", JSON.stringify(db), 'utf-8')
}

const timer = ms => new Promise(res => setTimeout(res, ms));

async function getEvents(address, topic, from, until) {
  const request = 'https://api.bscscan.com/api' +
    '?module=logs' +
    //'&apikey=14VRTK1XGIM7ICY3WDWI69FDXRA2V6AHI2' +
    '&action=getLogs' +
    '&fromBlock=' + from +
    '&toBlock=' + until +
    '&address=' + address +
    '&topic0=' + topic;

  const response = await axios.get(request)

  return response.data
}

function now() {
  return Math.floor(Date.now() / 1000);
}

function wei(amount) {
  return ethers.BigNumber.from(ethers.utils.parseEther(amount.toString()))
}

function hexToNumber(hex) {
  return ethers.BigNumber.from(hex).toNumber()
}

const asyncFilter = async (arr, predicate) => {
    const results = await Promise.all(arr.map(predicate));

    return arr.filter((_v, index) => results[index]);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
