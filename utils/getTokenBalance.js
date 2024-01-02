const { ethers } = require("hardhat");
const { tokenERC20ABI } = require("../helper-hardhat-config.js");

async function getTokenBalance(tokenAddress, account) {
     try {
          const provider = ethers.provider;
          const Token = await ethers.getContractAt(
               tokenERC20ABI,
               tokenAddress,
               provider,
          );
          const balance = await Token.balanceOf(account);
          return balance;
     } catch (error) {
          console.log(error);
     }
}

module.exports = { getTokenBalance };
