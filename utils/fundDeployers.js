const { fundAllAccounts, fundWithEther } = require("./fundAllAccounts.js");

//fund all the deployers
async function fundDeployers(deployers) {
     console.log(
          "Funding the accounts, this may take time, depends upon total accounts being funded...",
     );

     //skipping the owner account
     //for later testing
     //need no fundings of token
     let deployerAddresses = deployers
          .slice(1)
          .map((deployer) => deployer.address);
     await fundAllAccounts(deployerAddresses);

     //only ethers are funded to owner
     const ownerAddress = deployers[0].address;
     await fundWithEther(ownerAddress);
}

module.exports = { fundDeployers };
