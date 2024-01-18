const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const {
     Tokens,
     developmentChains,
     decimals,
     zeroAddress,
     amountPassed,
     tokenToStake,
     RewardAmount,
} = require("../helper-hardhat-config.js");
const { fundAllAccounts, fundWithEther } = require("./fundAllAccounts.js");
const { approveTokens } = require("./approveTokens.js");
const { getTotalStakedAmount } = require("./getTotalStakedAmount.js");
const { getTokenBalance } = require("./getTokenBalance.js");
const { getTimestamp } = require("./getTimestamp.js");
const { getSqrt } = require("./getSqrt.js");
const { StakingWithChainlink } = require("./StakingWithChainlink-deploy.js");
const { RewardToken } = require("./RewardToken-deploy.js");
const { fundDeployers } = require("./fundDeployers.js");
const { isUndefined } = require("./isUndefined.js");
const { transferRewardTokens } = require("./transferRewardTokens.js");
const { moveTime } = require("./moveTime.js");
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
     decimals,
     zeroAddress,
     amountPassed,
     tokenToStake,
     RewardAmount,
     moveTime,
     fundAllAccounts,
     fundWithEther,
     approveTokens,
     getTotalStakedAmount,
     getTokenBalance,
     getTimestamp,
     getSqrt,
     StakingWithChainlink,
     RewardToken,
     fundDeployers,
     isUndefined,
     transferRewardTokens,
};
