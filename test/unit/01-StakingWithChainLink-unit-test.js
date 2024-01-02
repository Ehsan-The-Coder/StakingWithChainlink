const {
     assert,
     expect,
     network,
     deployments,
     ethers,
     Tokens,
     developmentChains,
     decmals,
     zeroAddress,
     amountPassed,
     tokenToStake,
     approveTokens,
     getTotalStakedAmount,
     getTimestamp,
     deploy,
     fundDeployers,
     isUndefined,
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
            //tAddress==tokenAddress
            let SWCL,
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
            //uint256 public s_totalAmountUSD;
            let totalAmountUSD = 0n;
            //uint256 public s_Reward;
            let reward = 0n;

            //<----------------------------function---------------------------->
            //
            //set values of global variables
            async function settAddressAndPriceFeed(tIndex) {
                 tAddress = Tokens[tIndex]["address"];
                 priceFeed = Tokens[tIndex]["priceFeed"];
            }

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
                      totalAmount = tAmountUSD[tAddress][msgSender];
                 }
                 return totalAmount;
            }

            //<----------------------------before---------------------------->
            //
            before(async function () {
                 deployers = await ethers.getSigners();
                 deployer = deployers[ownerIndex];
                 dLength = deployers.length;

                 SWCL = await deploy(deployer);
                 await fundDeployers(deployers);

                 deployer = deployers[ownerIndex];
                 msgSender = deployer.address;
            });

            //<----------------------------test---------------------------->
            //
            //
            describe("constructor", function () {
                 it("sets the owner of the contract properly", async function () {
                      const owner = await SWCL.owner();
                      assert.equal(owner, msgSender);
                 });
            });
            //
            describe("setStakingToken function", function () {
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
            });
            //
            describe("stake function", function () {
                 //test all the event related to Staking
                 async function testStakingEvent(amountUSD) {
                      txResponse = SWCL.connect(deployer).stake(
                           tAddress,
                           tokenToStake,
                      );

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

                 it("is staking happening properly?", async function () {
                      //tIndex==tokenIndex
                      for (let tIndex = 0; tIndex < tLength; tIndex++) {
                           await settAddressAndPriceFeed(tIndex);
                           //skip the owner account for testing modifier
                           for (let dIndex = 1; dIndex < dLength; dIndex++) {
                                //deployer as staker
                                deployer = deployers[dIndex];
                                msgSender = deployer.address;
                                const amountUSD = await fAmountUSD(true);

                                await approveTokens(
                                     tAddress,
                                     deployer,
                                     SWCL.target,
                                     tokenToStake,
                                );

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
                      txResponse = SWCL.connect(deployer).unStake(tAddress);

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

                 it("is unStaking happening properly?", async function () {
                      // tIndex==tokenIndex
                      for (let tIndex = 0; tIndex < tLength; tIndex++) {
                           await settAddressAndPriceFeed(tIndex);

                           //skip the owner account for testing modifier
                           for (let unindex = 1; unindex < dLength; unindex++) {
                                //deployer as unStaker
                                deployer = deployers[unindex];
                                msgSender = deployer.address;
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
