// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

//<----------------------------import statements---------------------------->
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {PriceConverter} from "./PriceConverter.sol";

import "hardhat/console.sol";

/**
 * @title StakingWithChainLink
 * @author Muhammad Ehsan
 * contact https://github.com/EhsanTheCoderr
 * @dev This contract allows staking with ChainLink
 */

contract StakingWithChainLink is Ownable, ReentrancyGuard, Pausable {
     //<----------------------------state variable---------------------------->
     /**
      * @dev mapping that allows to store chainlink price feed address
      */
     mapping(IERC20 => AggregatorV3Interface) public s_stakingTokenPriceFeed;

     //<----------------------------events---------------------------->
     event TokenListedForStaking(
          IERC20 indexed token,
          AggregatorV3Interface indexed priceFeed,
          uint256 indexed timestamp
     );
     //<----------------------------custom errors---------------------------->
     error StakingWithChainLink__AddressNotValid(address _address);
     error StakingWithChainLink__TokenAlreadyListedForStaking(IERC20 token);
     error StakingWithChainLink__TokenNotListedForStaking(IERC20 token);
     //<----------------------------modifiers---------------------------->
     modifier isValidAddress(address _address) {
          if (_address == address(0) || _address == address(this)) {
               revert StakingWithChainLink__AddressNotValid(_address);
          }
          _;
     }
     modifier isStakingTokenListed(IERC20 token) {
          if (address(s_stakingTokenPriceFeed[token]) == address(0)) {
               revert StakingWithChainLink__TokenNotListedForStaking(token);
          }
          _;
     }
     modifier isStakingTokenNotListed(IERC20 token) {
          if (address(s_stakingTokenPriceFeed[token]) != address(0)) {
               revert StakingWithChainLink__TokenAlreadyListedForStaking(token);
          }
          _;
     }

     //<----------------------------functions---------------------------->
     //<----------------------------constructor---------------------------->
     constructor() Ownable(msg.sender) {}

     //<----------------------------external functions---------------------------->
     function stake(
          IERC20 token,
          uint256 amount
     ) external isStakingTokenListed(token) {}

     //<----------------------------external/public view/pure functions---------------------------->

     //<----------------------------private functions---------------------------->
     function setStakingToken(
          IERC20 token,
          AggregatorV3Interface priceFeed
     )
          external
          isValidAddress(address(token))
          isValidAddress(address(priceFeed))
          onlyOwner
          isStakingTokenNotListed(token)
     {
          s_stakingTokenPriceFeed[token] = priceFeed;
          emit TokenListedForStaking(token, priceFeed, block.timestamp);
     }
     //<----------------------------private view/pure functions---------------------------->
}
