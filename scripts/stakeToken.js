const {
     RewardAmount,
     ethers,
     Tokens,
     tokenToStake,
     approveTokens,
     StakingWithChainlink,
     RewardToken,
     fundDeployers,
     transferRewardTokens,
     moveTime,
     zeroAddress,
} = require("../utils/import-All.js");

let SWCL, RT, deployers, deployer, msgSender, tAddress, priceFeed;
const ownerIndex = 0;
const tLength = Tokens.length;
const thirtyDays = 30n * 24n * 60n * 60n; //thirty days

async function stakeToken() {
     deployers = await ethers.getSigners();
     deployer = deployers[ownerIndex];

     SWCL = await StakingWithChainlink(deployer);
     RT = await RewardToken();

     await fundDeployers(deployers);
     await setStakingToken();
     await SWCL.setRewardsDuration(thirtyDays);
     //transfer the rewardTokens to SWCL
     await transferRewardTokens(deployer, SWCL.target);
     await SWCL.notifyRewardQuantiy(RewardAmount);
     const finishAt = await SWCL.getFinishAt();
     const rewardRate = await SWCL.getRewardRate();
     console.log(
          `Reward is set, at Reward Rate ${rewardRate} & Finish At ${finishAt}`,
     );
     await stake();
     await moveTime(finishAt);
     await earned();
     await unStake();
     console.log(`unStaking the Tokens`);
}

stakeToken()
     .then(() => process.exit(0))
     .catch((error) => {
          console.log(error);
          process.exit(1);
     });

async function setStakingToken() {
     //save every token address and price feed to test
     for (let tIndex = 0; tIndex < tLength; tIndex++) {
          await settAddressAndPriceFeed(tIndex);
          //transactions
          //first check if the token already listed or not
          let priceFeed = await SWCL.getTokenPriceFeed(tAddress);
          // priceFeed == zeroAddress this means token not listed
          if (priceFeed == zeroAddress) {
               await SWCL.setStakingToken(tAddress, priceFeed);
          }
     }
}

//set values of global variables
async function settAddressAndPriceFeed(tIndex) {
     tAddress = Tokens[tIndex]["address"];
     priceFeed = Tokens[tIndex]["priceFeed"];
}

async function stake() {
     for (let tIndex = 0; tIndex < tLength; tIndex++) {
          await settAddressAndPriceFeed(tIndex);
          //skip the owner account for testing modifier
          const dLength = deployers.length;
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
               await SWCL.connect(deployer).stake(tAddress, tokenToStake);
               console.log(
                    `Account ${msgSender} Sataked ${tokenToStake} Tokens`,
               );
          }
     }
}
async function earned() {
     const dLength = deployers.length;
     for (let dIndex = 1; dIndex < dLength; dIndex++) {
          //deployer as staker
          deployer = deployers[dIndex];
          msgSender = deployer.address;

          console.log(
               `Account ${msgSender} earned ${await SWCL.earned(
                    msgSender,
               )} Tokens`,
          );

          await SWCL.connect(deployer).getReward();
     }
}

async function unStake() {
     for (let tIndex = 0; tIndex < tLength; tIndex++) {
          await settAddressAndPriceFeed(tIndex);
          //skip the owner account for testing modifier
          const dLength = deployers.length;
          for (let dIndex = 1; dIndex < dLength; dIndex++) {
               //deployer as staker
               deployer = deployers[dIndex];
               msgSender = deployer.address;

               await SWCL.connect(deployer).unStake(tAddress);
          }
     }
}
