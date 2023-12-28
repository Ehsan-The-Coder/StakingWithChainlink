// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

//<----------------------------import statements---------------------------->
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {ChainlinkManager} from "./ChainlinkManager.sol";
import {Utilis} from "./Utilis.sol";
import "hardhat/console.sol";

/**
 * @title StakingWithChainlink
 * @author Muhammad Ehsan
 * contact https://github.com/EhsanTheCoderr
 * @dev This contract allows staking with Chainlink
 */

contract StakingWithChainlink is Ownable, ReentrancyGuard, Pausable {
     //<----------------------------state variable---------------------------->
     /**
      * @dev mapping that allows to store Chainlink price feed address
      */
     mapping(IERC20 => AggregatorV3Interface) public s_stakingTokenPriceFeed;

     //<----------------------------events---------------------------->
     event TokenListedForStaking(
          IERC20 indexed token,
          AggregatorV3Interface indexed priceFeed,
          uint256 indexed timestamp
     );

     //<----------------------------custom errors---------------------------->

     //<----------------------------modifiers---------------------------->

     //<----------------------------functions---------------------------->
     //<----------------------------constructor---------------------------->
     constructor() Ownable(msg.sender) {}

     //<----------------------------external functions---------------------------->
     function stake(IERC20 token, uint256 amount) external {}

     //<----------------------------external/public view/pure functions---------------------------->

     //<----------------------------private functions---------------------------->
     function setStakingToken(
          IERC20 token,
          AggregatorV3Interface priceFeed
     ) external {
          s_stakingTokenPriceFeed[token] = priceFeed;
          emit TokenListedForStaking(token, priceFeed, block.timestamp);
     }
     //<----------------------------private view/pure functions---------------------------->
}
