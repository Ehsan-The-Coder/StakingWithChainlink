// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

//<----------------------------import statements---------------------------->
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// import "hardhat/console.sol";

/**
 * @title StakingWithChainLink
 * @author Muhammad Ehsan
 * contact https://github.com/EhsanTheCoderr
 * @dev This contract allows staking with ChainLink
 */

contract StakingWithChainLink is Ownable, ReentrancyGuard, Pausable {
     //<----------------------------state variable---------------------------->
     /**
      *@dev mapping(staking contract address=>available)
      *@dev track all the token owner allows the user to stake for and earn reward
      */
     mapping(IERC20 => bool) s_stakingContractAvailability;
     //<----------------------------events---------------------------->
     //<----------------------------custom errors---------------------------->
     error StakingWithChainLink__TokenNotListedForStaking(IERC20 token);
     //<----------------------------modifiers---------------------------->
     modifier isStakingContractAvailable(IERC20 token) {
          if (s_stakingContractAvailability[token] == false) {
               revert StakingWithChainLink__TokenNotListedForStaking(token);
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
     ) external isStakingContractAvailable(token) {}
     //<----------------------------external/public view/pure functions---------------------------->

     //<----------------------------private functions---------------------------->

     //<----------------------------private view/pure functions---------------------------->
}
