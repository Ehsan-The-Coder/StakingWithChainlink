const { run } = require("hardhat");

verify = async function (contractAddress, listOfArguments) {
     console.log("Verifying contract...");
     try {
          await run("verify:verify", {
               address: contractAddress,
               constructorArguments: listOfArguments,
          });
     } catch (error) {
          if (error.message.toLowerCase().includes("already verified")) {
               console.log("Already verified!");
          } else {
               console.log(e);
          }
     }
};

module.exports = { verify };
