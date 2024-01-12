const { ethers, deployments } = require("hardhat");

async function RewardToken(deployer) {
     let RewardToken;
     try {
          //try to fetch already deployed
          RewardToken = await ethers.getContract("RewardToken", deployer);
     } catch (error) {
          try {
               //if not then new deploy
               await deployments.fixture(["all"]);
               RewardToken = await ethers.getContract("RewardToken", deployer);
          } catch (error) {
               console.log(error);
          }
     }
     return RewardToken;
}

module.exports = { RewardToken };
