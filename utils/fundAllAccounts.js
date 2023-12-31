const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");
const {
     tokenERC20ABI,
     Tokens,
     richAccountOfEther,
     amountPassed,
} = require("../helper-hardhat-config.js");

//
let totalAccountNeedTokenFundings;

//
async function fundAllAccounts(accountsNeedFundings) {
     totalAccountNeedTokenFundings = accountsNeedFundings.length;
     try {
          //fund rich accounts from helper-hardhat-config.js
          await fundRichTokenAccountsWithEther();
          for (
               let indexAccount = 0;
               indexAccount < totalAccountNeedTokenFundings;
               indexAccount++
          ) {
               const accountsNeedFunding = accountsNeedFundings[indexAccount];
               await fundWithEther(accountsNeedFunding);
               await fundWithTokens(accountsNeedFunding);
          }
     } catch (error) {
          console.log(error);
     }
}

//fund all accounts that hold token
//with ether
//so we can use them later to transfer token
//if not then we don't have enough gas
async function fundRichTokenAccountsWithEther() {
     for (let indexAccount = 0; indexAccount < Tokens.length; indexAccount++) {
          const richAccountOfToken = Tokens[indexAccount]["richAccount"];
          await fundWithEther(richAccountOfToken);
     }
}

//fund any account/address with ether
async function fundWithEther(addressNeedEther) {
     try {
          //impersonating the rich account of ether
          const richAccount = await impersonateAccount(richAccountOfEther);

          //send transaction
          //using ether
          const tx = {
               to: addressNeedEther,
               value: amountPassed, //1 Ether
          };
          const txResponse = await richAccount.sendTransaction(tx);
          await txResponse.wait(1);
     } catch (error) {
          console.log(error);
     }
}

//like the fundWithEther
//here you can funds account with tokens
async function fundWithTokens(addressNeedTokens) {
     for (let indexAccount = 0; indexAccount < Tokens.length; indexAccount++) {
          try {
               //address of token
               const tokenAddress = Tokens[indexAccount]["address"];
               //address of rich token account holder
               const richAddressHoldsToken =
                    Tokens[indexAccount]["richAccount"];

               //impersonate account for signing the transactions
               const accountSigner = await impersonateAccount(
                    richAddressHoldsToken,
               );

               //
               // getting instance of token
               const Token = await ethers.getContractAt(
                    tokenERC20ABI,
                    tokenAddress,
                    accountSigner,
               );

               //getting total token balance
               //distributing tokens among all
               //totalAccountNeedTokenFundings + 1 for safety so we not run out of tokens
               const balance = await Token.balanceOf(richAddressHoldsToken);
               const fundAmount =
                    balance / (BigInt(totalAccountNeedTokenFundings) + 1n);

               await Token.transfer(addressNeedTokens, fundAmount);
          } catch (error) {
               console.log(error);
          }
     }
}

//impersonating the rich account
//returning it for signing transactions
//its forked not real
async function impersonateAccount(account) {
     //impersonate account for signing the transactions
     await helpers.impersonateAccount(account);
     const accountSigner = await ethers.getSigner(account);
     return accountSigner;
}
module.exports = { fundAllAccounts, fundWithEther };
