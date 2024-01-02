const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const {
     Tokens,
     developmentChains,
     decmals,
     zeroAddress,
     amountPassed,
     tokenToStake,
} = require("../../helper-hardhat-config.js");
const {
     fundAllAccounts,
     fundWithEther,
} = require("../../utils/fundAllAccounts.js");
const { approveTokens } = require("../../utils/approveTokens.js");
const { getTotalStakedAmount } = require("../../utils/getTotalStakedAmount.js");
const { getTokenBalance } = require("../../utils/getTokenBalance.js");
const { getTimestamp } = require("../../utils/getTimestamp.js");
const { getSqrt } = require("../../utils/getSqrt.js");
const { deploy } = require("../../utils/deploy.js");
const { fundDeployers } = require("../../utils/fundDeployers.js");
const { isUndefined } = require("../../utils/isUndefined.js");
//
//
//
module.exports = {
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
     fundAllAccounts,
     fundWithEther,
     approveTokens,
     getTotalStakedAmount,
     getTokenBalance,
     getTimestamp,
     getSqrt,
     deploy,
     fundDeployers,
     isUndefined,
};
