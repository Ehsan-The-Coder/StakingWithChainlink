// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "hardhat/console.sol";

/**
 * @title This library return the price feed from Chainlink
 * @author Muhammad Ehsan
 * Inspired from https://github.com/PatrickAlphaC
 * @notice You are going to pass address and this return the price of token/asset
 */
contract TestChainlink {
     error TestChainlink__RevertedThePriceFeed(
          AggregatorV3Interface priceFeed,
          bytes reason
     );

     /**
      * @param priceFeed passing the price feed address
      * @return price of specific token with 18 decimals
      * @notice through error if the price feed contract is not availabe on Chainlink
      */
     function getPrice(
          AggregatorV3Interface priceFeed
     ) internal view returns (uint256 price) {
          //https://docs.chain.link/data-feeds/using-data-feeds
          //catching the error if the address passed is not valid
          try priceFeed.latestRoundData() returns (
               uint80 /*roundID*/,
               int256 answer,
               uint256 /*startedAt*/,
               uint256 /*timeStamp*/,
               uint80 /*answeredInRound*/
          ) {
               //different price feed have different decimals
               //so making them same to 18 decimals
               uint64 decimals = 18 - priceFeed.decimals();
               if (decimals > 0) {
                    price = uint256(answer) * 10 ** decimals;
               } else {
                    price = uint256(answer);
               }
          } catch (bytes memory reason) {
               revert TestChainlink__RevertedThePriceFeed(priceFeed, reason);
          }
          return price;
     }

     /**
      *
      * @param amount amount you want to convert
      * @param priceFeed address of the chain
      */
     function getTotalStakedAmount(
          AggregatorV3Interface priceFeed,
          uint256 amount
     ) public view returns (uint256 totalAmount) {
          uint256 price = getPrice(priceFeed);
          //1e13 keep only 5 decimal places
          if (price > 0) {
               totalAmount = ((price * amount) / 1e13);
          }
     }
}
