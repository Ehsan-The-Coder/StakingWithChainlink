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
     : describe("StakingWithChainLink Contract localhost/hardhat", function () {
            let StakingWithChainLink,
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
            async function deploy() {
                 try {
                      StakingWithChainLink = await ethers.getContract(
                           "StakingWithChainLink",
                           deployer,
                      );
                 } catch (error) {
                      try {
                           await deployments.fixture(["all"]);
                           StakingWithChainLink = await ethers.getContract(
                                "StakingWithChainLink",
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
                      const owner = await StakingWithChainLink.owner();
                      assert.equal(owner, deployer.address);
                 });
            });
            describe("setStakingToken function", function () {
                 it("expected to revert with StakingWithChainLink__AddressNotValid", async function () {
                      txResponse = StakingWithChainLink.setStakingToken(
                           zeroAddress,
                           zeroAddress,
                      );
                      await expect(txResponse).to.be.revertedWithCustomError(
                           StakingWithChainLink,
                           "StakingWithChainLink__AddressNotValid",
                      );
                      txResponse = StakingWithChainLink.setStakingToken(
                           StakingWithChainLink.target,
                           StakingWithChainLink.target,
                      );
                      await expect(txResponse).to.be.revertedWithCustomError(
                           StakingWithChainLink,
                           "StakingWithChainLink__AddressNotValid",
                      );
                 });
                 it("setStakingToken function expected to revert if not owner account ", async function () {
                      await setTokenAddressAndPriceFeed(0);
                      deployer = deployers[ownerIndex + 1];

                      txResponse = StakingWithChainLink.connect(
                           deployer,
                      ).setStakingToken(tokenAddress, priceFeed);

                      await expect(txResponse).to.be.revertedWithCustomError(
                           StakingWithChainLink,
                           "OwnableUnauthorizedAccount",
                      );
                      deployer = deployers[ownerIndex];
                 });
                 it("setStakingToken function passing token and pricefeeds", async function () {
                      for (i = 0; i < tokenAddresses.length; i++) {
                           await setTokenAddressAndPriceFeed(i);
                           //transactions
                           txResponse = StakingWithChainLink.setStakingToken(
                                tokenAddress,
                                priceFeed,
                           );
                           //calculte timestamp
                           const txResponseResult = await txResponse;
                           const txReceipt = await txResponseResult.wait(1);
                           const block = await ethers.provider.getBlock(
                                txReceipt.blockNumber,
                                true,
                           );
                           const timestamp = BigInt(block.timestamp);
                           //2nd test to check mapping
                           const expPriceFeed =
                                await StakingWithChainLink.s_stakingTokenPriceFeed(
                                     tokenAddress,
                                );
                           //test
                           await expect(txResponse)
                                .to.emit(
                                     StakingWithChainLink,
                                     "TokenListedForStaking",
                                )
                                .withArgs(tokenAddress, priceFeed, timestamp);
                           assert.equal(expPriceFeed, priceFeed);
                      }
                 });
                 it("expected to revert with  StakingWithChainLink__TokenAlreadyListedForStaking", async function () {
                      txResponse = StakingWithChainLink.setStakingToken(
                           tokenAddress,
                           priceFeed,
                      );

                      await expect(txResponse).to.be.revertedWithCustomError(
                           StakingWithChainLink,
                           "StakingWithChainLink__TokenAlreadyListedForStaking",
                      );
                 });
            });
            describe("stake function", function () {
                 it("expected to revert with StakingWithChainLink__TokenNotListedForStaking", async function () {
                      txResponse = StakingWithChainLink.stake(
                           StakingWithChainLink.target,
                           amountPassed,
                      );
                      await expect(txResponse).to.be.revertedWithCustomError(
                           StakingWithChainLink,
                           "StakingWithChainLink__TokenNotListedForStaking",
                      );
                 });
            });
       });
