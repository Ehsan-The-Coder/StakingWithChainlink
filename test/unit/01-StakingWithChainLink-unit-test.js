const {
     assert,
     expect,
     RewardAmount,
     decimals,
     network,
     deployments,
     ethers,
     Tokens,
     developmentChains,
     zeroAddress,
     amountPassed,
     tokenToStake,
     approveTokens,
     getTotalStakedAmount,
     getTimestamp,
     StakingWithChainlink,
     RewardToken,
     fundDeployers,
     isUndefined,
     transferRewardTokens,
} = require("./import-All.js");

!(
     developmentChains.includes(network.name) &&
     (network.name == "localhost" || network.name == "hardhat")
)
     ? describe
     : describe("StakingWithChainlink Contract localhost/hardhat", function () {
            //Note: Lengthy Names of variables avoid as they were decreasing readability

            //<----------------------------function variables---------------------------->
            //
            //SWCL==StakingWithChainlink
            //RT=RewardToken
            //tAddress==tokenAddress
            let isTest = false;
            let SWCL,
                 RT,
                 tAddress,
                 priceFeed,
                 deployer,
                 msgSender,
                 deployers,
                 txResponse;
            const ownerIndex = 0;
            const tLength = Tokens.length;
            let dLength; //deployer/signer length
            let tokenToUnstake = 0n;

            //<----------------------------contract variables---------------------------->
            //
            //
            //mapping(IERC20 token => AggregatorV3Interface priceFeed) public s_tokenPriceFeed;
            let tPriceFeed = {};
            //mapping(IERC20 token => mapping(address staker => uint256 tokenAmount))public s_stakerTokenQuantity;
            let tokenQuantity = {};
            //mapping(IERC20 token => mapping(address staker => uint256 amountUSD))public s_stakerTokenAmountUSD;
            let tAmountUSD = {};
            //mapping(address staker => uint256 balance) public s_stakerBalanceUSD;
            let balanceUSD = {};
            // mapping(address => uint) public s_userRewardPerTokenPaid;
            let userRewardPerTokenPaid = {};
            // mapping(address => uint) public s_rewards;
            let rewards = {};
            //uint256 public s_totalAmountUSD;
            let totalAmountUSD = 0n;
            //   uint256 public s_duration;
            let duration = 0n;
            // uint public s_finishAt;
            let finishAt = 0n;
            // uint public s_updatedAt;
            let updatedAt = 0n;
            // uint public s_rewardRate;
            let rewardRate = 0n;
            // uint public s_rewardPerTokenStored;
            let rewardPerTokenStored = 0n;
            //
            //

            //<----------------------------function---------------------------->
            //
            //set values of global variables
            async function settAddressAndPriceFeed(tIndex) {
                 tAddress = Tokens[tIndex]["address"];
                 priceFeed = Tokens[tIndex]["priceFeed"];
            }
            let isStakingTrue;
            //return token staked amount from chainlink pricefeed
            async function fAmountUSD(isStaking) {
                 let totalAmount = 0n;
                 if (isStaking === true) {
                      const priceFeedAddress = tPriceFeed[tAddress];
                      totalAmount = await getTotalStakedAmount(
                           deployer,
                           priceFeedAddress,
                           tokenToStake,
                      );
                 } else {
                      isUndefined(tAmountUSD, tAddress, msgSender);
                      totalAmount = tAmountUSD[tAddress][msgSender];
                 }
                 return totalAmount;
            }

            //test the update reward used all variable
            async function testUpdateReward(_account) {
                 assert.equal(
                      rewardPerTokenStored,
                      await SWCL.s_rewardPerTokenStored(),
                 );
                 assert.equal(
                      rewardPerTokenStored,
                      await SWCL.rewardPerToken(),
                 );

                 assert.equal(updatedAt, await SWCL.s_updatedAt());

                 //
                 await isUndefined(rewards, _account);
                 assert.equal(
                      rewards[_account],
                      await SWCL.s_rewards(_account),
                 );
                 assert.equal(rewards[_account], await SWCL.earned(_account));
                 //
                 isUndefined(userRewardPerTokenPaid, _account);
                 assert.equal(
                      userRewardPerTokenPaid[_account],
                      await SWCL.s_rewardPerTokenStored(),
                 );
                 assert.equal(
                      userRewardPerTokenPaid[_account],
                      rewardPerTokenStored,
                 );
            }

            //updateReward(address _account)
            //create a test for this so when ever function call tested
            //that uses this modifier also test this
            async function updateReward(_account) {
                 console.log(
                      "<-------------------------Test-------------------------->",
                 );
                 rewardPerTokenStored = await rewardPerToken();
                 console.log(`rewardPerTokenStored ${rewardPerTokenStored}`);
                 updatedAt = await lastTimeRewardApplicable();
                 console.log(`updatedAt ${updatedAt}`);
                 if (_account != zeroAddress) {
                      await isUndefined(rewards, _account);

                      rewards[_account] = await earned(_account);
                      //
                      //
                      await isUndefined(userRewardPerTokenPaid, _account);
                      userRewardPerTokenPaid[_account] = rewardPerTokenStored;
                      console.log(`rewards[_account] ${rewards[_account]}`);
                      console.log(
                           `userRewardPerTokenPaid[_account] ${userRewardPerTokenPaid[_account]}`,
                      );
                 }
            }

            //function to get rewardPerToken()
            async function rewardPerToken() {
                 if (totalAmountUSD == 0) {
                      //   console.log(
                      //        "<----------------contract rewardPerToken function ---------------",
                      //   );
                      return rewardPerTokenStored;
                 }
                 const rewardReturn =
                      rewardPerTokenStored +
                      (rewardRate *
                           ((await lastTimeRewardApplicable()) - updatedAt) *
                           decimals) /
                           totalAmountUSD;

                 return rewardReturn;
            }

            //
            async function lastTimeRewardApplicable() {
                 return await SWCL.lastTimeRewardApplicable();
            }

            //
            async function earned(_account) {
                 await isUndefined(balanceUSD, _account);
                 await isUndefined(userRewardPerTokenPaid, _account);
                 await isUndefined(rewards, _account);

                 const eranedReturn =
                      (balanceUSD[_account] *
                           ((await rewardPerToken()) -
                                userRewardPerTokenPaid[_account])) /
                           decimals +
                      rewards[_account];
                 return eranedReturn;
            }

            //<----------------------------before---------------------------->
            //
            before(async function () {
                 deployers = await ethers.getSigners();
                 deployer = deployers[ownerIndex];
                 dLength = deployers.length;

                 SWCL = await StakingWithChainlink(deployer);
                 RT = await RewardToken();

                 await fundDeployers(deployers);

                 deployer = deployers[ownerIndex];
                 msgSender = deployer.address;
            });

            //<----------------------------test---------------------------->
            //
            //
            describe("constructor", function () {
                 it("isContract modifier|| expected to revert back if not pass rewardToken address properly", async function () {
                      const tempSWCL = await ethers.getContractFactory(
                           "StakingWithChainlink",
                      );
                      //expected revert as passing zeroAddress for RewardToken
                      txResponse = tempSWCL.deploy(zeroAddress);
                      await expect(txResponse).to.be.revertedWithCustomError(
                           tempSWCL,
                           "StakingWithChainlink__AddressNotValid",
                      );

                      //expected revert as passing deployers for RewardToken
                      txResponse = tempSWCL.deploy(deployer.address);

                      await expect(txResponse).to.be.revertedWithCustomError(
                           tempSWCL,
                           "StakingWithChainlink__AddressNotValid",
                      );
                 });
                 it("sets the owner of the contract properly", async function () {
                      const owner = await SWCL.owner();
                      assert.equal(owner, msgSender);
                 });
                 it("sets the Reward Token properly", async function () {
                      const rewardTokenAddress = await SWCL.s_rewardToken();

                      assert.notEqual(rewardTokenAddress, zeroAddress);
                 });
            });
            //
            describe("setStakingToken function", function () {
                 it("onlyOwner modifier|| expected to revert back if other than owner account is used", async function () {
                      deployer = deployers[1];

                      await settAddressAndPriceFeed(0);
                      //transactions
                      txResponse = SWCL.connect(deployer).setStakingToken(
                           tAddress,
                           priceFeed,
                      );
                      await expect(txResponse).to.be.revertedWithCustomError(
                           SWCL,
                           "OwnableUnauthorizedAccount",
                      );
                 });

                 it("setStakingToken function passing token and pricefeeds", async function () {
                      //save every token address and price feed to test
                      for (let tIndex = 0; tIndex < tLength; tIndex++) {
                           await settAddressAndPriceFeed(tIndex);
                           //transactions
                           txResponse = SWCL.setStakingToken(
                                tAddress,
                                priceFeed,
                           );
                           //get timestamp
                           const timestamp = await getTimestamp(txResponse);
                           //test
                           await expect(txResponse)
                                .to.emit(SWCL, "TokenListedForStakingChanged")
                                .withArgs(tAddress, priceFeed, timestamp, true);

                           //2nd test to check mapping
                           const expPriceFeed =
                                await SWCL.s_tokenPriceFeed(tAddress);
                           assert.equal(expPriceFeed, priceFeed);
                           tPriceFeed[tAddress] = priceFeed;
                      }
                 });

                 it("isTokenAlreadyListed modifier|| expected to revert back if passed the same token", async function () {
                      //passing the same token which already listed

                      txResponse = SWCL.setStakingToken(tAddress, priceFeed);
                      await expect(txResponse).to.be.revertedWithCustomError(
                           SWCL,
                           "StakingWithChainlink__TokenAlreadyListed",
                      );
                 });
            });
            //
            describe("setRewardsDurations function", function () {
                 it("setting the rewardDurations successfuly", async function () {
                      deployer = deployers[ownerIndex];

                      const currentTimestamp = await getTimestamp();
                      const thirtyDays = 30n * 24n * 60n * 60n;
                      const rewardDuration = currentTimestamp + thirtyDays;

                      await SWCL.setRewardsDuration(rewardDuration);
                      duration = await SWCL.s_duration();

                      assert.equal(rewardDuration, duration);
                 });
            });
            //
            describe("notifyRewardQuantiy function ", function () {
                 beforeEach(async function () {
                      deployer = deployers[ownerIndex];
                 });
                 //
                 it("isQuantityZero modifier|| StakingWithChainlink__GivenQuantityIsZero error|| expected to revert", async function () {
                      const zeroQuantity = 0n;
                      txResponse = SWCL.notifyRewardQuantiy(zeroQuantity);

                      await expect(txResponse).to.be.revertedWithCustomError(
                           SWCL,
                           "StakingWithChainlink__GivenQuantityIsZero",
                      );
                 });
                 //
                 //
                 it("StakingWithChainlink__InsufficientBalanceForRewards error|| expected to revert", async function () {
                      txResponse = SWCL.notifyRewardQuantiy(RewardAmount);

                      await expect(txResponse).to.be.revertedWithCustomError(
                           SWCL,
                           "StakingWithChainlink__InsufficientBalanceForRewards",
                      );
                      //update and test the common values of updateReward() modifier
                      await updateReward(zeroAddress);
                      await testUpdateReward(zeroAddress);
                 });
                 //
                 it("StakingWithChainlink__RewardRateIsZero error|| expected to revert", async function () {
                      // transfer the rewardTokens to SWCL
                      await transferRewardTokens(deployer, SWCL.target);

                      const tooLowReward = 10n;
                      txResponse = SWCL.notifyRewardQuantiy(tooLowReward);

                      await expect(txResponse).to.be.revertedWithCustomError(
                           SWCL,
                           "StakingWithChainlink__RewardRateIsZero",
                      );
                      //update and test the common values of updateReward() modifier
                      await updateReward(zeroAddress);
                      await testUpdateReward(zeroAddress);
                 });
                 //
                 async function updateValues(response) {
                      let timestamp = await getTimestamp(response);
                      if (timestamp >= finishAt) {
                           rewardRate = RewardAmount / duration;
                      } else {
                           let remainingRewards =
                                (finishAt - timestamp) * rewardRate;
                           rewardRate =
                                (RewardAmount + remainingRewards) / duration;
                      }

                      finishAt = timestamp + duration;
                      updatedAt = timestamp;
                 }
                 //
                 it("set notifyRewardQuantiy function properly", async function () {
                      for (let index = 0; index <= 2; index++) {
                           //transfer the rewardTokens to SWCL
                           await transferRewardTokens(deployer, SWCL.target);

                           txResponse =
                                await SWCL.notifyRewardQuantiy(RewardAmount);
                           //
                           await updateValues(txResponse);
                           await txResponse;
                           //update the common values of updateReward() modifier
                           await updateReward(zeroAddress);
                           //test
                           assert.equal(finishAt, await SWCL.s_finishAt());
                           assert.equal(updatedAt, await SWCL.s_updatedAt());
                           assert.equal(rewardRate, await SWCL.s_rewardRate());
                           //test the common values of updateReward() modifier
                           await testUpdateReward(zeroAddress);
                      }
                 });
            });
            //
            describe("isDurationFinished modifier", function () {
                 it("isDurationFinished modifier|| StakingWithChainlink__DurationNotFinished error|| expected to revert", async function () {
                      const currentTimestamp = await getTimestamp();
                      const thirtyDays = 30n * 24n * 60n * 60n;
                      const rewardDuration = currentTimestamp + thirtyDays;

                      txResponse = SWCL.setRewardsDuration(rewardDuration);
                      duration = await SWCL.s_duration();
                      await expect(txResponse).to.be.revertedWithCustomError(
                           SWCL,
                           "StakingWithChainlink__DurationNotFinished",
                      );
                 });
            });
            //
            describe("stake function", function () {
                 //passing the token that is not listed
                 it("isTokenNotListed modifier|| expected to revert back if passed the same token", async function () {
                      tAddress = zeroAddress;
                      txResponse = SWCL.stake(tAddress, tokenToStake);
                      await expect(txResponse).to.be.revertedWithCustomError(
                           SWCL,
                           "StakingWithChainlink__TokenNotListed",
                      );
                 });
                 //test all the event related to Staking
                 async function testStakingEvent(amountUSD) {
                      //test events
                      await expect(txResponse)
                           .to.emit(SWCL, "TotalAmountSatkedChangedUSD")
                           .withArgs(msgSender, amountUSD, true);
                      await expect(txResponse)
                           .to.emit(SWCL, "TokenStakingQuantityChanged")
                           .withArgs(tAddress, msgSender, tokenToStake, true);
                      await expect(txResponse)
                           .to.emit(SWCL, "AmountStakedUSDChanged")
                           .withArgs(tAddress, msgSender, amountUSD, true);
                      await expect(txResponse)
                           .to.emit(SWCL, "StakerBalanceChangedUSD")
                           .withArgs(msgSender, amountUSD, true);
                 }
                 //update value after staking
                 async function updateValues(amountUSD) {
                      async function areValuesUnDefinded() {
                           await isUndefined(
                                tokenQuantity,
                                tAddress,
                                msgSender,
                           );
                           await isUndefined(tAmountUSD, tAddress, msgSender);
                           await isUndefined(balanceUSD, msgSender);
                      }

                      await areValuesUnDefinded();
                      tokenQuantity[tAddress][msgSender] += tokenToStake;
                      tAmountUSD[tAddress][msgSender] += amountUSD;
                      balanceUSD[msgSender] += amountUSD;
                      totalAmountUSD += amountUSD;
                 }
                 //test values after updatevalues and staking
                 async function testValuesSetProperly() {
                      const expTokenQuantity =
                           tokenQuantity[tAddress][msgSender];
                      const expAmountUSD = tAmountUSD[tAddress][msgSender];
                      const expBalanceUSD = balanceUSD[msgSender];
                      const expTotalAmountUSD = totalAmountUSD;

                      const actTokenQuantity = await SWCL.s_stakerTokenQuantity(
                           tAddress,
                           msgSender,
                      );
                      const acttAmountUSD = await SWCL.s_stakerTokenAmountUSD(
                           tAddress,
                           msgSender,
                      );
                      const actBalanceUSD =
                           await SWCL.s_stakerBalanceUSD(msgSender);
                      const actualTotalAmountUSD =
                           await SWCL.s_totalAmountUSD();

                      //test values
                      assert.equal(expTokenQuantity, actTokenQuantity);
                      assert.equal(expAmountUSD, acttAmountUSD);
                      assert.equal(expBalanceUSD, actBalanceUSD);
                      assert.equal(expTotalAmountUSD, actualTotalAmountUSD);
                 }
                 //
                 it("is staking happening properly?", async function () {
                      //tIndex==tokenIndex
                      for (let tIndex = 0; tIndex < 1; tIndex++) {
                           await settAddressAndPriceFeed(tIndex);
                           //skip the owner account for testing modifier
                           for (let dIndex = 1; dIndex < dLength; dIndex++) {
                                //deployer as staker
                                deployer = deployers[dIndex];
                                msgSender = deployer.address;
                                await approveTokens(
                                     tAddress,
                                     deployer,
                                     SWCL.target,
                                     tokenToStake,
                                );
                                txResponse = SWCL.connect(deployer).stake(
                                     tAddress,
                                     tokenToStake,
                                );
                                //we are not awaiting txResponse above
                                //because we need to test events with the pending transaction
                                //awaiting here so transaction completed in the contract so we can test the
                                //updateReward modifier
                                await txResponse;

                                //update and test the common values of updateReward() modifier
                                await updateReward(msgSender);
                                await testUpdateReward(msgSender);

                                const amountUSD = await fAmountUSD(true);
                                //update values before so we can test
                                //event arguments
                                await updateValues(amountUSD);
                                //test
                                await testStakingEvent(amountUSD);
                                await testValuesSetProperly();
                           }
                      }
                 });
            });
            //
            describe("unStake function", function () {
                 //test all the event related to Staking
                 async function testUnStakingEvent(amountUSD) {
                      //test events
                      await expect(txResponse)
                           .to.emit(SWCL, "TotalAmountSatkedChangedUSD")
                           .withArgs(msgSender, amountUSD, false);
                      await expect(txResponse)
                           .to.emit(SWCL, "TokenStakingQuantityChanged")
                           .withArgs(
                                tAddress,
                                msgSender,
                                tokenToUnstake,
                                false,
                           );
                      await expect(txResponse)
                           .to.emit(SWCL, "AmountStakedUSDChanged")
                           .withArgs(tAddress, msgSender, amountUSD, false);
                      await expect(txResponse)
                           .to.emit(SWCL, "StakerBalanceChangedUSD")
                           .withArgs(msgSender, amountUSD, false);
                 }
                 //update value after staking
                 async function updateValues(amountUSD) {
                      await isUndefined(balanceUSD, msgSender);

                      tAmountUSD[tAddress][msgSender] = 0n;
                      tokenQuantity[tAddress][msgSender] = 0n;

                      totalAmountUSD -= amountUSD;
                      balanceUSD[msgSender] -= amountUSD;
                 }
                 //test values after updatevalues and staking
                 async function testValuesSetProperly() {
                      //both below expect to zero
                      //expUntokenQuantity===expUntAmountUSD===0n
                      const expUntokenQuantity =
                           tokenQuantity[tAddress][msgSender];
                      const expUntAmountUSD = tAmountUSD[tAddress][msgSender];
                      const expBalanceUSD = balanceUSD[msgSender];
                      const expTotalAmountUSD = totalAmountUSD;

                      const actualUntokenQuantity =
                           await SWCL.s_stakerTokenQuantity(
                                tAddress,
                                msgSender,
                           );
                      const actualUntAmountUSD =
                           await SWCL.s_stakerTokenAmountUSD(
                                tAddress,
                                msgSender,
                           );
                      const actBalanceUSD =
                           await SWCL.s_stakerBalanceUSD(msgSender);
                      const actualTotalAmountUSD =
                           await SWCL.s_totalAmountUSD();

                      //test values
                      assert.equal(expUntokenQuantity, actualUntokenQuantity);
                      assert.equal(expUntAmountUSD, actualUntAmountUSD);
                      assert.equal(expBalanceUSD, actBalanceUSD);
                      assert.equal(expTotalAmountUSD, actualTotalAmountUSD);
                 }
                 //set the expected token quantity being unstaked
                 async function setTokenToUnstake() {
                      await isUndefined(tokenQuantity, tAddress, msgSender);
                      tokenToUnstake = tokenQuantity[tAddress][msgSender];
                 }
                 //
                 it("is unStaking happening properly?", async function () {
                      // tIndex==tokenIndex
                      for (let tIndex = 0; tIndex < tLength; tIndex++) {
                           await settAddressAndPriceFeed(tIndex);
                           //skip the owner account for testing modifier
                           for (let unindex = 1; unindex < dLength; unindex++) {
                                //deployer as unStaker
                                deployer = deployers[unindex];
                                msgSender = deployer.address;

                                txResponse =
                                     SWCL.connect(deployer).unStake(tAddress);
                                //we are not awaiting txResponse above
                                //because we need to test events with the pending transaction
                                //awaiting here so transaction completed in the contract so we can test the
                                //updateReward modifier
                                await txResponse;

                                //update and test the common values of updateReward() modifier
                                await updateReward(msgSender);
                                await testUpdateReward(msgSender);

                                const amountUSD = await fAmountUSD(false);
                                await setTokenToUnstake();
                                //update values before so we can test
                                //event arguments
                                await updateValues(amountUSD);

                                //   test
                                await testUnStakingEvent(amountUSD);
                                await testValuesSetProperly(amountUSD);
                           }
                      }
                 });
            });
       });
