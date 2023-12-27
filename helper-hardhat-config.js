const { ethers } = require("hardhat");

const tokenAddresses = [
     "0xdAC17F958D2ee523a2206206994597C13D831ec7",
     "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
     "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
     "0xD46bA6D942050d489DBd938a2C909A5d5039A161",
];
const tokenSymbols = ["USDT", "USDC", "stETH", "AMPL"];
//address off chainLink price feed relevant contract
//[USDT/USD,USDC/USD,stETH/USD,APL/USD]
const priceFeedAddresses = [
     "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D",
     "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
     "0xCfE54B5cD566aB89272946F602D76Ea879CAb4a8",
     "0xe20CA8D7546932360e37E9D72c1a47334af57706",
];

const usdtAccounts = [
     "0xf977814e90da44bfa03b6295a0616a897441acec",
     "0xb38e8c17e38363af6ebdcb3dae12e0243582891d",
     "0xb6cfcf89a7b22988bfc96632ac2a9d6dab60d641",
     "0x62383739d68dd0f844103db8dfb05a7eded5bbe6",
     "0x3e0199792ce69dc29a0a36146bfa68bd7c8d6633",
];
const usdcAccounts = [
     "0xd6ad7a6750a7593e092a9b218d66c0a814a3436e",
     "0xe859d659aa9c43799451b3bab94a25e80f833a67",
     "0x4d5136acee6bccfe0db5fdc889c4a42019e8f05f",
     "0x8a7ab4337eac26a6a454a2356696686eed680efb",
     "0x108e4bfd9cda6243e1de53b71d08a0111974efc1",
];
const stethAccounts = [
     "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",
     "0x1982b2f5814301d4e9a8b0201555376e62f82428",
     "0x5f6ae08b8aeb7078cf2f96afb089d7c9f51da47d",
     "0x93c4b944d05dfe6df7645a86cd2206016c51564d",
     "0xa980d4c0c2e48d305b582aa439a3575e3de06f0e",
];
const aplAccounts = [
     "0x0b13d49ab7d6c6e4ff0b4330564e2b1e97c067b9",
     "0x56606d52e8f4186c80cf94a6230986bacba8b6b5",
     "0x308bc844fe1987b087b4c12cd6a93af89c2cd79d",
     "0xe1f09d3e295fead16fa9795396a83e51fc9f92df",
     "0xce5f4abae3d770240b5962e55a5372cb31ae60b0",
];
const accounts = [usdtAccounts, usdcAccounts, stethAccounts, aplAccounts];

const Tokens = {
     "0xdAC17F958D2ee523a2206206994597C13D831ec7": {
          symbol: tokenSymbols[0],
          priceFeed: priceFeedAddresses[0],
          signers: usdtAccounts,
     },
     "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": {
          symbol: tokenSymbols[1],
          priceFeed: priceFeedAddresses[1],
          signers: usdcAccounts,
     },
     "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84": {
          symbol: tokenSymbols[2],
          priceFeed: priceFeedAddresses[2],
          signers: stethAccounts,
     },
     "0xD46bA6D942050d489DBd938a2C909A5d5039A161": {
          symbol: tokenSymbols[3],
          priceFeed: priceFeedAddresses[3],
          signers: aplAccounts,
     },
};

const decmals = ethers.WeiPerEther; //1000000000000000000n
const zeroAddress = ethers.ZeroAddress;
const amountPassed = 2n * decmals;

const developmentChains = ["hardhat", "localhost", "ganache"];

module.exports = {
     tokenAddresses,
     Tokens,
     developmentChains,
     decmals,
     zeroAddress,
     amountPassed,
};
