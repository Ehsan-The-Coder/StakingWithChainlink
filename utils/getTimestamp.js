const { ethers } = require("hardhat");

async function getTimestamp(txResponse) {
     let timestamp = 0n;
     if (txResponse === undefined) {
          const latestBlock = await ethers.provider.getBlock("latest", true);
          timestamp = BigInt(latestBlock.timestamp);
     } else {
          const txResponseResult = await txResponse;
          const txReceipt = await txResponseResult.wait(1);
          //set true to get block details, if false return only blocknumber
          const block = await ethers.provider.getBlock(
               txReceipt.blockNumber,
               true,
          );
          timestamp = BigInt(block.timestamp);
     }
     return timestamp;
}
module.exports = { getTimestamp };
