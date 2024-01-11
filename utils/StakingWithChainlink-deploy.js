const { ethers, deployments } = require("hardhat");

async function StakingWithChainlink(deployer) {
     let StakingWithChainlink;
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
     return StakingWithChainlink;
}

module.exports = { StakingWithChainlink };
