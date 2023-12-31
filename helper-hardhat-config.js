const { ethers } = require("hardhat");

const testChainlinkABI = [
     {
          inputs: [
               {
                    internalType: "contract AggregatorV3Interface",
                    name: "priceFeed",
                    type: "address",
               },
               {
                    internalType: "bytes",
                    name: "reason",
                    type: "bytes",
               },
          ],
          name: "TestChainlink__RevertedThePriceFeed",
          type: "error",
     },
     {
          inputs: [
               {
                    internalType: "contract AggregatorV3Interface",
                    name: "priceFeed",
                    type: "address",
               },
               {
                    internalType: "uint256",
                    name: "amount",
                    type: "uint256",
               },
          ],
          name: "getTotalStakedAmount",
          outputs: [
               {
                    internalType: "uint256",
                    name: "totalAmount",
                    type: "uint256",
               },
          ],
          stateMutability: "view",
          type: "function",
     },
];

const tokenERC20ABI = [
     {
          constant: true,
          inputs: [],
          name: "name",
          outputs: [
               {
                    name: "",
                    type: "string",
               },
          ],
          payable: false,
          stateMutability: "view",
          type: "function",
     },
     {
          constant: true,
          inputs: [],
          name: "symbol",
          outputs: [
               {
                    name: "",
                    type: "string",
               },
          ],
          payable: false,
          stateMutability: "view",
          type: "function",
     },
     {
          constant: true,
          inputs: [],
          name: "decimals",
          outputs: [
               {
                    name: "",
                    type: "uint8",
               },
          ],
          payable: false,
          stateMutability: "view",
          type: "function",
     },
     {
          constant: true,
          inputs: [
               {
                    name: "_owner",
                    type: "address",
               },
          ],
          name: "balanceOf",
          outputs: [
               {
                    name: "balance",
                    type: "uint256",
               },
          ],
          payable: false,
          stateMutability: "view",
          type: "function",
     },
     {
          constant: false,
          inputs: [
               {
                    name: "_to",
                    type: "address",
               },
               {
                    name: "_value",
                    type: "uint256",
               },
          ],
          name: "transfer",
          outputs: [
               {
                    name: "",
                    type: "bool",
               },
          ],
          payable: false,
          stateMutability: "nonpayable",
          type: "function",
     },
     {
          constant: true,
          inputs: [
               {
                    name: "_owner",
                    type: "address",
               },
               {
                    name: "_spender",
                    type: "address",
               },
          ],
          name: "allowance",
          outputs: [
               {
                    name: "remaining",
                    type: "uint256",
               },
          ],
          payable: false,
          stateMutability: "view",
          type: "function",
     },
     {
          constant: false,
          inputs: [
               {
                    name: "_spender",
                    type: "address",
               },
               {
                    name: "_value",
                    type: "uint256",
               },
          ],
          name: "approve",
          outputs: [
               {
                    name: "",
                    type: "bool",
               },
          ],
          payable: false,
          stateMutability: "nonpayable",
          type: "function",
     },
     {
          constant: false,
          inputs: [
               {
                    name: "_from",
                    type: "address",
               },
               {
                    name: "_to",
                    type: "address",
               },
               {
                    name: "_value",
                    type: "uint256",
               },
          ],
          name: "transferFrom",
          outputs: [
               {
                    name: "",
                    type: "bool",
               },
          ],
          payable: false,
          stateMutability: "nonpayable",
          type: "function",
     },
     {
          anonymous: false,
          inputs: [
               {
                    indexed: true,
                    name: "owner",
                    type: "address",
               },
               {
                    indexed: true,
                    name: "spender",
                    type: "address",
               },
               {
                    indexed: false,
                    name: "value",
                    type: "uint256",
               },
          ],
          name: "Approval",
          type: "event",
     },
     {
          anonymous: false,
          inputs: [
               {
                    indexed: true,
                    name: "from",
                    type: "address",
               },
               {
                    indexed: true,
                    name: "to",
                    type: "address",
               },
               {
                    indexed: false,
                    name: "value",
                    type: "uint256",
               },
          ],
          name: "Transfer",
          type: "event",
     },
];

const Tokens = [
     {
          address: "0x111111111117dC0aa78b770fA6A738034120C302",
          name: "1INCH Token",
          symbol: "1INCH",
          priceFeed: "0xc929ad75B72593967DE83E7F7Cda0493458261D9", //     1NCH/USD
          richAccount: "0x6630444cdbd42a024da079615f3bbce8edd5a7ba",
     },
     {
          address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          name: "USD Coin",
          symbol: "USDC",
          priceFeed: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
          richAccount: "0xd6ad7a6750a7593e092a9b218d66c0a814a3436e", //     USDC/USD
     },
     {
          address: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
          name: "Liquid staked Ether 2.0",
          symbol: "stETH",
          priceFeed: "0xCfE54B5cD566aB89272946F602D76Ea879CAb4a8",
          richAccount: "0x6663613fbd927ce78abbf7f5ca7e2c3fe0d96d18", //     STETH/USD
     },
     {
          address: "0xD46bA6D942050d489DBd938a2C909A5d5039A161",
          name: "Ampleforth",
          symbol: "AMPL",
          priceFeed: "0xe20CA8D7546932360e37E9D72c1a47334af57706",
          richAccount: "0xc3a947372191453dd9db02b0852d378dccbdf271", //     AMPL/USD
     },
];

const richAccountOfEther = "0x00000000219ab540356cbb839cbe05303d7705fa";
const decmals = ethers.WeiPerEther; //1000000000000000000n
const zeroAddress = ethers.ZeroAddress;
const amountPassed = 1n * decmals;
let tokenToStake = 100n;

const developmentChains = ["hardhat", "localhost", "ganache"];

module.exports = {
     testChainlinkABI,
     tokenERC20ABI,
     Tokens,
     richAccountOfEther,
     developmentChains,
     decmals,
     zeroAddress,
     amountPassed,
     tokenToStake,
};
