const { network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config.js");
require("dotenv").config();
const { verify } = require("../utils/verify-contract-task.js");

module.exports = async ({ getNamedAccounts, deployments }) => {
     const { deploy, log } = deployments;
     const { deployer } = await getNamedAccounts();

     const StakingWithChainLink = await deploy("StakingWithChainLink", {
          from: deployer,
          args: [],
          log: true,
          waitConfirmations: network.config.blockConfirmations || 1,
     });
     if (
          !developmentChains.includes(network.name) &&
          process.env.ETHERSCAN_API_KEY
     ) {
          await verify(StakingWithChainLink.address, []);
     }
     log("---------------------------------------------------------");
};
module.exports.tags = ["all", "StakingWithChainLink"];
