const { network } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
     const { deploy, log } = deployments;
     const { deployer } = await getNamedAccounts();

     await deploy("TestChainlink", {
          from: deployer,
          args: [],
          log: true,
          waitConfirmations: network.config.blockConfirmations || 1,
     });

     log("---------------------------------------------------------");
};
module.exports.tags = ["all", "TestChainlink"];
