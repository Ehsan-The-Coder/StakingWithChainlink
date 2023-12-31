const { assert, expect } = require("chai");
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { network, deployments, ethers } = require("hardhat");
const {
     Tokens,
     developmentChains,
     decmals,
     zeroAddress,
     amountPassed,
     tokenToStake,
} = require("../../helper-hardhat-config.js");
const {
     fundAllAccounts,
     fundWithEther,
} = require("../../utils/fundAllAccounts.js");
const { approveTokens } = require("../../utils/approveTokens.js");
const { getTotalStakedAmount } = require("../../utils/getTotalStakedAmount.js");

!(
     developmentChains.includes(network.name) &&
     (network.name == "localhost" || network.name == "hardhat")
)
     ? describe
     : describe("StakingWithChainlink Contract localhost/hardhat", function () {
            let StakingWithChainlink,
                 tokenAddress,
                 priceFeed,
                 deployer,
                 deployerAddress,
                 deployers,
                 txResponse;
            const ownerIndex = 0;
            const tokenLength = Tokens.length;

            let tokenPriceFeed = {};
            let stakerTokenQuantity = {};
            let stakerTokenAmountUSD = {};
            let stakerBalanceUSD = {};
            let totalAmountUSD = 0n;
            let reward = 0n;

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
            //set values of global variables
            async function setTokenAddressAndPriceFeed(indexAccount) {
                 tokenAddress = Tokens[indexAccount]["address"];
                 priceFeed = Tokens[indexAccount]["priceFeed"];
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
            //fund all the deployers
            async function fundDeployers() {
                 //skipping the owner account
                 //for later testing
                 //need no fundings of token
                 let deployerAddresses = deployers
                      .slice(1)
                      .map((deployer) => deployer.address);
                 //only ether is funded to owner
                 const ownerAddress = deployers[ownerIndex].address;

                 console.log(
                      "Funding the accounts, this may take time, depends upon total accounts being funded...",
                 );

                 await fundAllAccounts(deployerAddresses);
                 await fundWithEther(ownerAddress);
            }
            async function deploy() {
                 try {
                      //try to fetch already deployed
                      StakingWithChainlink = await ethers.getContract(
                           "StakingWithChainlink",
                           deployer,
                      );
                 } catch (error) {
                      try {
                           //if not then new deploy
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
            //return token staked amount from chainlink pricefeed
            async function makeTotalAmountUSD() {
                 const priceFeedAddress = tokenPriceFeed[tokenAddress];
                 const totalAmount = await getTotalStakedAmount(
                      deployer,
                      priceFeedAddress,
                      tokenToStake,
                 );
                 return totalAmount;
            }
            before(async function () {
                 deployers = await ethers.getSigners();
                 deployer = deployers[ownerIndex];
                 await deploy();
                 await fundDeployers();
                 deployerAddress = deployer.address;
            });
            describe("constructor", function () {
                 it("sets the owner of the contract properly", async function () {
                      const owner = await StakingWithChainlink.owner();
                      assert.equal(owner, deployerAddress);
                 });
            });
            describe("setStakingToken function", function () {
                 it("setStakingToken function passing token and pricefeeds", async function () {
                      //save every token address and price feed to test
                      for (
                           let indexAccount = 0;
                           indexAccount < tokenLength;
                           indexAccount++
                      ) {
                           await setTokenAddressAndPriceFeed(indexAccount);

                           //transactions
                           txResponse = StakingWithChainlink.setStakingToken(
                                tokenAddress,
                                priceFeed,
                           );
                           //get timestamp
                           const timestamp = await getTimestamp(txResponse);
                           //test
                           await expect(txResponse)
                                .to.emit(
                                     StakingWithChainlink,
                                     "TokenListedForStakingChanged",
                                )
                                .withArgs(
                                     tokenAddress,
                                     priceFeed,
                                     timestamp,
                                     true,
                                );

                           //2nd test to check mapping
                           const expPriceFeed =
                                await StakingWithChainlink.s_tokenPriceFeed(
                                     tokenAddress,
                                );
                           assert.equal(expPriceFeed, priceFeed);
                           tokenPriceFeed[tokenAddress] = priceFeed;
                      }
                 });
            });

            describe("stake function", function () {
                 //test all the event related to Staking
                 async function testStakingEvent() {
                      txResponse = StakingWithChainlink.connect(deployer).stake(
                           tokenAddress,
                           tokenToStake,
                      );
                      const getTotalAmountUSDNow = await makeTotalAmountUSD();
                      //test events
                      await expect(txResponse)
                           .to.emit(
                                StakingWithChainlink,
                                "TotalAmountSatkedChangedUSD",
                           )
                           .withArgs(
                                deployerAddress,
                                getTotalAmountUSDNow,
                                true,
                           );
                      await expect(txResponse)
                           .to.emit(
                                StakingWithChainlink,
                                "TokenStakingQuantityChanged",
                           )
                           .withArgs(
                                tokenAddress,
                                deployerAddress,
                                tokenToStake,
                                true,
                           );
                      await expect(txResponse)
                           .to.emit(
                                StakingWithChainlink,
                                "AmountStakedUSDChanged",
                           )
                           .withArgs(
                                tokenAddress,
                                deployerAddress,
                                getTotalAmountUSDNow,
                                true,
                           );
                      await expect(txResponse)
                           .to.emit(
                                StakingWithChainlink,
                                "StakerBalanceChangedUSD",
                           )
                           .withArgs(
                                deployerAddress,
                                getTotalAmountUSDNow,
                                true,
                           );
                 }
                 //update value after staking
                 async function updateValues() {
                      if (stakerTokenQuantity[tokenAddress] === undefined) {
                           stakerTokenQuantity[tokenAddress] = {};
                      }
                      if (
                           stakerTokenQuantity[tokenAddress][
                                deployerAddress
                           ] === undefined
                      ) {
                           stakerTokenQuantity[tokenAddress][deployerAddress] =
                                0n;
                      }
                      if (stakerTokenAmountUSD[tokenAddress] === undefined) {
                           stakerTokenAmountUSD[tokenAddress] = {};
                      }
                      if (
                           stakerTokenAmountUSD[tokenAddress][
                                deployerAddress
                           ] === undefined
                      ) {
                           stakerTokenAmountUSD[tokenAddress][deployerAddress] =
                                0n;
                      }
                      if (stakerBalanceUSD[deployerAddress] === undefined) {
                           stakerBalanceUSD[deployerAddress] = 0n;
                      }
                      const amountUSD = await makeTotalAmountUSD();
                      stakerTokenQuantity[tokenAddress][deployerAddress] +=
                           tokenToStake;
                      stakerTokenAmountUSD[tokenAddress][deployerAddress] +=
                           amountUSD;
                      stakerBalanceUSD[deployerAddress] += amountUSD;
                      totalAmountUSD += amountUSD;
                 }
                 //test values after updatevalues and staking
                 async function testValuesSetProperly() {
                      const expStakerTokenQuantity =
                           stakerTokenQuantity[tokenAddress][deployerAddress];
                      const expStakerTokenAmountUSD =
                           stakerTokenAmountUSD[tokenAddress][deployerAddress];
                      const expStakerBalanceUSD =
                           stakerBalanceUSD[deployerAddress];
                      const expTotalAmountUSD = totalAmountUSD;

                      const actualStakerTokenQuantity =
                           await StakingWithChainlink.s_stakerTokenQuantity(
                                tokenAddress,
                                deployerAddress,
                           );
                      const actualStakerTokenAmountUSD =
                           await StakingWithChainlink.s_stakerTokenAmountUSD(
                                tokenAddress,
                                deployerAddress,
                           );
                      const actualStakerBalanceUSD =
                           await StakingWithChainlink.s_stakerBalanceUSD(
                                deployerAddress,
                           );
                      const actualTotalAmountUSD =
                           await StakingWithChainlink.s_totalAmountUSD();

                      //test values
                      assert.equal(
                           expStakerTokenQuantity,
                           actualStakerTokenQuantity,
                      );
                      assert.equal(
                           expStakerTokenAmountUSD,
                           actualStakerTokenAmountUSD,
                      );
                      assert.equal(expStakerBalanceUSD, actualStakerBalanceUSD);
                      assert.equal(expTotalAmountUSD, actualTotalAmountUSD);
                 }
                 //
                 it("is staking happening properly", async function () {
                      for (
                           let tokenIndex = 0;
                           tokenIndex < tokenLength;
                           tokenIndex++
                      ) {
                           await setTokenAddressAndPriceFeed(tokenIndex);

                           //skip the owner account for testing modifier
                           for (
                                let stakerIndex = 1;
                                stakerIndex < deployers.length;
                                stakerIndex++
                           ) {
                                //deployer as staker
                                deployer = deployers[stakerIndex];
                                deployerAddress = deployer.address;
                                await approveTokens(
                                     tokenAddress,
                                     deployer,
                                     StakingWithChainlink.target,
                                     tokenToStake,
                                );
                                //update values before so we can test
                                //event arguments
                                await updateValues();

                                await testStakingEvent();
                                await testValuesSetProperly();
                           }
                      }
                 });
            });
       });
