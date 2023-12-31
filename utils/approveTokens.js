const { ethers } = require("hardhat");
const { tokenERC20ABI } = require("../helper-hardhat-config.js");

async function approveTokens(tokenAddress, signer, spender, value) {
     try {
          const Token = await ethers.getContractAt(
               tokenERC20ABI,
               tokenAddress,
               signer,
          );
          await Token.approve(spender, value);
     } catch (error) {
          console.log(error);
     }
}

module.exports = { approveTokens };
