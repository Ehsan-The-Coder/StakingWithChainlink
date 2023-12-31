const { ethers } = require("hardhat");
const { testChainlinkABI } = require("../helper-hardhat-config.js");

async function getTotalStakedAmount(signer, priceFeedAddress, amount) {
     try {
          const TestChainlink = await ethers.getContract(
               "TestChainlink",
               signer,
          );

          const totalAmount = await TestChainlink.getTotalStakedAmount(
               priceFeedAddress,
               amount,
          );

          return totalAmount;
     } catch (error) {
          console.log(error);
     }
}

module.exports = { getTotalStakedAmount };
