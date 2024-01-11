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
const {
     StakingWithChainlink,
} = require("../../utils/StakingWithChainlink-deploy.js");
const { RewardToken } = require("../../utils/RewardToken-deploy.js");
const { fundDeployers } = require("../../utils/fundDeployers.js");
const { isUndefined } = require("../../utils/isUndefined.js");
const { transferRewardTokens } = require("../../utils/transferRewardTokens.js");
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
