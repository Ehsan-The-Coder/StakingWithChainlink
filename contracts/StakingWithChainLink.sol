// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

//<----------------------------import statements---------------------------->
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {ChainlinkManager} from "./libraries/ChainlinkManager.sol";
import {Utilis} from "./libraries/Utilis.sol";
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
     IERC20 public immutable s_rewardToken;

     uint private constant DECIMALS = 1e18;
     // Duration of rewards to be paid out (in seconds)
     uint256 public s_duration;
     // Timestamp of when the rewards finish
     uint public s_finishAt;
     // Minimum of last updated time and reward finish time
     uint public s_updatedAt;
     // Reward to be paid out per second
     uint public s_rewardRate;
     // Sum of (reward rate * deltaTime * DECIMALS / total supply)
     uint public s_rewardPerTokenStored;
     // User address => rewardPerTokenStored
     mapping(address => uint) public s_userRewardPerTokenPaid;
     // User address => rewards to be claimed
     mapping(address => uint) public s_rewards;

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
     error StakingWithChainlink__TokenAlreadyListed(IERC20 token);
     error StakingWithChainlink__TokenNotListed(IERC20 token);
     error StakingWithChainlink__DurationNotFinished(
          uint256 finishAt,
          uint256 currentTimestamp
     );
     error StakingWithChainlink__RewardRateIsZero();
     error StakingWithChainlink__InsufficientBalanceForRewards(
          uint256 rewardAmount,
          uint256 balance
     );
     error StakingWithChainlink__GivenQuantityIsZero();
     error StakingWithChainlink__RewardDurationIsZero();

     //<----------------------------modifiers---------------------------->
     //update the reward and userRewardRerTokenPaid
     modifier updateReward(address _account) {
          s_rewardPerTokenStored = rewardPerToken();
          s_updatedAt = lastTimeRewardApplicable();

          if (_account != address(0)) {
               s_rewards[_account] = earned(_account);
               s_userRewardPerTokenPaid[_account] = s_rewardPerTokenStored;
          }
          _;
     }
     //this checks that address is contract address or other address
     modifier isContract(address _address) {
          if (!Utilis.isContract(_address)) {
               revert StakingWithChainlink__AddressNotValid(_address);
          }
          _;
     }
     modifier isTokenAlreadyListed(IERC20 token) {
          if (address(s_tokenPriceFeed[token]) != address(0)) {
               revert StakingWithChainlink__TokenAlreadyListed(token);
          }
          _;
     }
     modifier isTokenNotListed(IERC20 token) {
          if (address(s_tokenPriceFeed[token]) == address(0)) {
               revert StakingWithChainlink__TokenNotListed(token);
          }
          _;
     }
     modifier isDurationFinished() {
          if (s_finishAt > block.timestamp) {
               revert StakingWithChainlink__DurationNotFinished(
                    s_finishAt,
                    block.timestamp
               );
          }
          _;
     }
     modifier isQuantityZero(uint256 quantity) {
          if (quantity == 0) {
               revert StakingWithChainlink__GivenQuantityIsZero();
          }
          _;
     }
     // we can use same isQuantityZero==isDurationZero to check zero
     //but reply become ambiguous
     //if we add custom message, this cast more
     modifier isDurationZero(uint256 duration) {
          if (duration == 0) {
               revert StakingWithChainlink__RewardDurationIsZero();
          }
          _;
     }
     modifier hasBalance(uint256 quantity) {
          uint256 balance = s_rewardToken.balanceOf(address(this));
          if (quantity > balance) {
               revert StakingWithChainlink__InsufficientBalanceForRewards(
                    quantity,
                    balance
               );
          }
          _;
     }

     //<----------------------------functions---------------------------->
     //<----------------------------constructor---------------------------->
     constructor(
          IERC20 rewardToken
     ) isContract(address(rewardToken)) Ownable(msg.sender) {
          s_rewardToken = rewardToken;
     }

     //<----------------------------external functions---------------------------->

     function setStakingToken(
          IERC20 token,
          AggregatorV3Interface priceFeed
     )
          external
          isContract(address(token))
          isContract(address(priceFeed))
          isTokenAlreadyListed(token)
          onlyOwner
     {
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
     ) external isTokenNotListed(token) nonReentrant updateReward(msg.sender) {
          token.transferFrom(msg.sender, address(this), quantity);
          uint256 amountUSD = ChainlinkManager.getTotalStakedAmount(
               s_tokenPriceFeed[token],
               quantity
          );
          _stake(token, quantity, amountUSD);
     }

     function unStake(
          IERC20 token
     )
          external
          isContract(address(token))
          nonReentrant
          updateReward(msg.sender)
     {
          uint256 amountUSD = s_stakerTokenAmountUSD[token][msg.sender];
          uint256 quantity = s_stakerTokenQuantity[token][msg.sender];

          _unStake(token, quantity, amountUSD);
     }

     function getReward() external nonReentrant updateReward(msg.sender) {
          uint reward = s_rewards[msg.sender];
          if (reward > 0) {
               s_rewards[msg.sender] = 0;
               s_rewardToken.transfer(msg.sender, reward);
          }
     }

     function setRewardsDuration(
          uint duration
     ) external onlyOwner isDurationFinished isDurationZero(duration) {
          s_duration = duration;
     }

     function notifyRewardQuantiy(
          uint quantity
     )
          external
          onlyOwner
          isQuantityZero(quantity)
          isDurationZero(s_duration)
          updateReward(address(0))
          hasBalance(quantity)
     {
          //calling storage variable to many times cost much more
          //store in local variable to save some gas
          uint256 rewardRate = s_rewardRate;
          uint256 duration = s_duration;
          uint timestamp = block.timestamp;

          if (timestamp >= s_finishAt) {
               //isDurationZero modifier already check weather durations is zero
               //so we don't get error
               rewardRate = quantity / duration;
          } else {
               uint remainingRewards = (s_finishAt - timestamp) * rewardRate;
               rewardRate = (quantity + remainingRewards) / duration;
          }

          if (rewardRate == 0) {
               revert StakingWithChainlink__RewardRateIsZero();
          }

          s_finishAt = timestamp + duration;
          s_updatedAt = timestamp;
          s_rewardRate = rewardRate;
     }

     //<----------------------------external/public view/pure functions---------------------------->
     function lastTimeRewardApplicable() public view returns (uint) {
          return Utilis.min(s_finishAt, block.timestamp);
     }

     function rewardPerToken() public view returns (uint) {
          if (s_totalAmountUSD == 0) {
               return s_rewardPerTokenStored;
          }
          return
               s_rewardPerTokenStored +
               (s_rewardRate *
                    (lastTimeRewardApplicable() - s_updatedAt) *
                    DECIMALS) /
               s_totalAmountUSD;
     }

     function earned(address _account) public view returns (uint) {
          return
               ((s_stakerBalanceUSD[_account] *
                    (rewardPerToken() - s_userRewardPerTokenPaid[_account])) /
                    DECIMALS) + s_rewards[_account];
     }

     function getTotalStakedAmount(
          AggregatorV3Interface priceFeed,
          uint256 quantity
     ) public view isContract(address(priceFeed)) returns (uint256) {
          return ChainlinkManager.getTotalStakedAmount(priceFeed, quantity);
     }

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
