const { network } = require("hardhat");

async function moveTime(number) {
     number = Number(number);
     console.log("Moving blocks...");
     await network.provider.send("evm_increaseTime", [number]);
     console.log(`Moved forward in time ${number} seconds`);
}

module.exports = { moveTime };
