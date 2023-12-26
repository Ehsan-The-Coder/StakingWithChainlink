const { network } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
     const { deploy, log } = deployments;
     const { deployer } = await getNamedAccounts();
     for (i = 1; i <= 6; i++) {
          const Token = "Token" + i;
          await deploy(Token, {
               from: deployer,
               args: [],
               log: true,
               waitConfirmations: network.config.blockConfirmations || 1,
          });
     }
     log("---------------------------------------------------------");
};
module.exports.tags = ["all", "test", "Tokens"];
