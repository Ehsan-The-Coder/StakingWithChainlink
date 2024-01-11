const { ethers } = require("hardhat");
const { RewardAmount } = require("../helper-hardhat-config.js");

async function transferRewardTokens(signer, spenderAddress) {
     try {
          const Token = await ethers.getContract("RewardToken", signer);
          //rather than minting and transfer
          //directly mint to required address
          await Token.mint(spenderAddress, RewardAmount);
     } catch (error) {
          console.log(error);
     }
}

module.exports = { transferRewardTokens };
