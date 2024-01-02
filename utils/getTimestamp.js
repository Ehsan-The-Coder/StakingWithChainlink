const { ethers } = require("hardhat");
//get timestamp we pass the transaction receipt
//function return timestamp
async function getTimestamp(txResponse) {
     const txResponseResult = await txResponse;
     const txReceipt = await txResponseResult.wait(1);
     //set true to get block details, if false return only blocknumber
     const block = await ethers.provider.getBlock(txReceipt.blockNumber, true);
     const timestamp = BigInt(block.timestamp);
     return timestamp;
}
module.exports = { getTimestamp };
