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
     mapping(IERC20 token => AggregatorV3Interface priceFeed)
          public s_tokenPriceFeed;
     mapping(IERC20 token => mapping(address staker => uint256 tokenAmount))
          public s_stakerTokenQuantity;
     mapping(IERC20 token => mapping(address staker => uint256 amountUSD))
          public s_stakerTokenAmountUSD;
     mapping(address staker => uint256 balance) public s_stakerBalanceUSD;
     uint256 public s_totalAmountUSD;
     uint256 public s_Reward;
     //<----------------------------events---------------------------->

     //isAdded=true, when change is positive
     //isAdded=false, when change is Nigitive
     event TokenListedForStakingChanged(
          IERC20 indexed token,
          AggregatorV3Interface indexed priceFeed,
          uint256 indexed timestamp,
          bool isAdded
     );
     event TokenStakingQuantityChanged(
          IERC20 indexed token,
          address indexed changer,
          uint256 quantity,
          bool isAdded
     );
     event AmountStakedUSDChanged(
          IERC20 indexed token,
          address indexed changer,
          uint256 amountUSD,
          bool isAdded
     );
     event TotalAmountSatkedChangedUSD(
          address indexed changer,
          uint256 totalStakedAmountUSD,
          bool isAdded
     );
     event StakerBalanceChangedUSD(
          address indexed changer,
          uint256 balance,
          bool isAdded
     );
     //<----------------------------custom errors---------------------------->
     error StakingWithChainlink__AddressNotValid(address _address);

     //<----------------------------modifiers---------------------------->
     //this checks that address is contract address or other address
     modifier isContract(address _address) {
          if (!Utilis.isContract(_address)) {
               revert StakingWithChainlink__AddressNotValid(_address);
          }
          _;
     }

     //<----------------------------functions---------------------------->
     //<----------------------------constructor---------------------------->
     constructor() Ownable(msg.sender) {}

     //<----------------------------external functions---------------------------->
     function setStakingToken(
          IERC20 token,
          AggregatorV3Interface priceFeed
     ) external isContract(address(token)) isContract(address(priceFeed)) {
          s_tokenPriceFeed[token] = priceFeed;
          emit TokenListedForStakingChanged(
               token,
               priceFeed,
               block.timestamp,
               true
          );
     }

     function stake(
          IERC20 token,
          uint256 quantity
     ) external isContract(address(token)) {
          token.transferFrom(msg.sender, address(this), quantity);
          uint256 amountUSD = ChainlinkManager.getTotalStakedAmount(
               s_tokenPriceFeed[token],
               quantity
          );

          _stake(token, quantity, amountUSD);
     }

     function unStake(IERC20 token) external isContract(address(token)) {
          uint256 amountUSD = s_stakerTokenAmountUSD[token][msg.sender];
          uint256 quantity = s_stakerTokenQuantity[token][msg.sender];

          _unStake(token, quantity, amountUSD);
     }

     //<----------------------------external/public view/pure functions---------------------------->

     //<----------------------------private functions---------------------------->
     function _stake(
          IERC20 token,
          uint256 quantity,
          uint256 amountUSD
     ) private {
          s_totalAmountUSD += amountUSD;
          s_stakerTokenQuantity[token][msg.sender] += quantity;
          s_stakerBalanceUSD[msg.sender] += amountUSD;
          s_stakerTokenAmountUSD[token][msg.sender] += amountUSD;

          emit TotalAmountSatkedChangedUSD(msg.sender, amountUSD, true);
          emit TokenStakingQuantityChanged(token, msg.sender, quantity, true);
          emit AmountStakedUSDChanged(token, msg.sender, amountUSD, true);
          emit StakerBalanceChangedUSD(msg.sender, amountUSD, true);
     }

     function _unStake(
          IERC20 token,
          uint256 quantity,
          uint256 amountUSD
     ) private {
          s_stakerTokenAmountUSD[token][msg.sender] = 0;
          s_stakerTokenQuantity[token][msg.sender] = 0;
          s_totalAmountUSD -= amountUSD;
          s_stakerBalanceUSD[msg.sender] -= amountUSD;

          token.transfer(msg.sender, quantity);

          emit TotalAmountSatkedChangedUSD(msg.sender, amountUSD, false);
          emit TokenStakingQuantityChanged(token, msg.sender, quantity, false);
          emit AmountStakedUSDChanged(token, msg.sender, amountUSD, false);
          emit StakerBalanceChangedUSD(msg.sender, amountUSD, false);
     }
     //<----------------------------private view/pure functions---------------------------->
}
