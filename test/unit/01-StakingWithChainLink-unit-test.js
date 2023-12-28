const { assert, expect } = require("chai");
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { network, deployments, ethers } = require("hardhat");
const {
     tokenAddresses,
     Tokens,
     developmentChains,
     decmals,
     zeroAddress,
     amountPassed,
} = require("../../helper-hardhat-config.js");

!(
     developmentChains.includes(network.name) &&
     (network.name == "localhost" || network.name == "hardhat")
)
     ? describe
     : describe("StakingWithChainlink Contract localhost/hardhat", function () {
            let StakingWithChainlink,
                 signer,
                 tokenAddress,
                 priceFeed,
                 deployer,
                 deployers,
                 txResponse;
            const ownerIndex = 0;

            function Sqrt(bigIntN) {
                 if (bigIntN < 0n) {
                      throw new Error(
                           "Square root of negative numbers is not supported for BigInts.",
                      );
                 }
                 if (bigIntN === 0n || bigIntN === 1n) {
                      return bigIntN;
                 }
                 let left = 1n;
                 let right = bigIntN;

                 while (left <= right) {
                      const mid = (left + right) / 2n;
                      const midSquared = mid * mid;
                      if (midSquared === bigIntN) {
                           return mid;
                      } else if (midSquared < bigIntN) {
                           left = mid + 1n;
                      } else {
                           right = mid - 1n;
                      }
                 }
                 // If we didn't find an exact match, return the floor of the square root
                 return right;
            }
            async function getSigner(address) {
                 await helpers.impersonateAccount(address);
                 signer = await ethers.getSigner(address);
            }
            //set values of global variables
            async function setSigner(tokenAddressIndex, accountIndex) {
                 tokenAddress = tokenAddresses[tokenAddressIndex];
                 const signers = Tokens[tokenAddress]["signers"];
                 await getSigner(signers[accountIndex]);
            }
            //set values of global variables
            async function setTokenAddressAndPriceFeed(tokenAddressIndex) {
                 tokenAddress = tokenAddresses[tokenAddressIndex];
                 priceFeed = Tokens[tokenAddress]["priceFeed"];
            }
            //get timestamp we pass the transaction receipt
            //function return timestamp
            async function getTimestamp(_txResponse) {
                 const txResponseResult = await _txResponse;
                 const txReceipt = await txResponseResult.wait(1);
                 const block = await ethers.provider.getBlock(
                      txReceipt.blockNumber,
                      true,
                 );
                 const timestamp = BigInt(block.timestamp);
                 return timestamp;
            }
            async function deploy() {
                 try {
                      StakingWithChainlink = await ethers.getContract(
                           "StakingWithChainlink",
                           deployer,
                      );
                 } catch (error) {
                      try {
                           await deployments.fixture(["all"]);
                           StakingWithChainlink = await ethers.getContract(
                                "StakingWithChainlink",
                                deployer,
                           );
                      } catch (error) {
                           console.log(error);
                      }
                 }
            }
            before(async function () {
                 // passing 1st account of token 1st as signers
                 deployers = await ethers.getSigners();
                 deployer = deployers[ownerIndex];
                 await deploy();
            });
            describe("constructor", function () {
                 it("sets the owner of the contract properly", async function () {
                      const owner = await StakingWithChainlink.owner();
                      assert.equal(owner, deployer.address);
                 });
            });
            describe("setStakingToken function", function () {
                 it("setStakingToken function passing token and pricefeeds", async function () {
                      //save every token address and price feed to test
                      for (i = 0; i < tokenAddresses.length; i++) {
                           await setTokenAddressAndPriceFeed(i);
                           //transactions
                           txResponse = StakingWithChainlink.setStakingToken(
                                tokenAddress,
                                priceFeed,
                           );
                           //get timestamp
                           const timestamp = await getTimestamp(txResponse);
                           //2nd test to check mapping
                           const expPriceFeed =
                                await StakingWithChainlink.s_stakingTokenPriceFeed(
                                     tokenAddress,
                                );
                           //test
                           await expect(txResponse)
                                .to.emit(
                                     StakingWithChainlink,
                                     "TokenListedForStaking",
                                )
                                .withArgs(tokenAddress, priceFeed, timestamp);
                           assert.equal(expPriceFeed, priceFeed);
                      }
                 });
            });
            describe("stake function", function () {});
       });
