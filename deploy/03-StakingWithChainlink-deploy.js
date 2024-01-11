const { network, ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config.js");
require("dotenv").config();
const { verify } = require("../utils/verify-contract-task.js");

module.exports = async ({ getNamedAccounts, deployments }) => {
     const { deploy, log } = deployments;
     const { deployer } = await getNamedAccounts();

     const RewardToken = await deployments.get("RewardToken");
     const StakingWithChainlink = await deploy("StakingWithChainlink", {
          from: deployer,
          args: [RewardToken.address],
          log: true,
          waitConfirmations: network.config.blockConfirmations || 1,
     });
     if (
          !developmentChains.includes(network.name) &&
          process.env.ETHERSCAN_API_KEY
     ) {
          await verify(StakingWithChainlink.address, [RewardToken.address]);
     }
     log("---------------------------------------------------------");
};
module.exports.tags = ["all", "StakingWithChainlink"];
