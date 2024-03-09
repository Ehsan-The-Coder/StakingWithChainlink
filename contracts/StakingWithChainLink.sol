// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

//<----------------------------import statements---------------------------->
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {ChainlinkManager} from "./libraries/ChainlinkManager.sol";
import {Utilis} from "./libraries/Utilis.sol";

/**
 * @title StakingWithChainlink a decentralize way of staking tokens and earning reward
 * @author Muhammad Ehsan
 * contact https://github.com/Ehsan-The-Coder
 * @dev This project is a DeFi application that enables users to stake
 *  their tokens and earn rewards using Chainlink oracles.
 * Users can stake any token listed on a decentralized exchange
 * and verified by the Chainlink oracle network.
 */

contract StakingWithChainlink is Ownable, ReentrancyGuard, Pausable {
     //<----------------------------state variable---------------------------->
     uint256 private constant DECIMALS = 1e18;
     //ERC20 token for rewards
     IERC20 private immutable s_rewardToken;
     // Duration of rewards to be paid out (in seconds)
     uint256 private s_duration;
     // Timestamp of when the rewards finish
     uint256 private s_finishAt;
     // Minimum of last updated time and reward finish time
     uint256 private s_updatedAt;
     // Reward to be paid out per second
     uint256 private s_rewardRate;
     // Sum of (reward rate * deltaTime * DECIMALS / total supply)
     uint256 private s_rewardPerTokenStored;
     // User address => rewardPerTokenStored
     mapping(address => uint256) private s_userRewardPerTokenPaid;
     // User address => rewards to be claimed
     mapping(address => uint256) private s_rewards;
     //hold the total staked amount in usd
     uint256 private s_totalAmountUSD;
     //store the priceFeed related to token
     mapping(IERC20 token => AggregatorV3Interface priceFeed)
          private s_tokenPriceFeed;
     //how many tokens any user staked of specific token
     mapping(IERC20 token => mapping(address staker => uint256 tokenAmount))
          private s_stakerTokenQuantity;
     //what is USD value of  any user staked of specific token
     mapping(IERC20 token => mapping(address staker => uint256 amountUSD))
          private s_stakerTokenAmountUSD;
     //how much USD value any user/staker has staked
     mapping(address staker => uint256 balance) private s_stakerBalanceUSD;
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
     /**
      * @notice this modifier is the heart of whole application
      * if this fails/collapse the whole application suffer
      * update all of the variable whenever somebody
      * 1. stake
      * 2. unstake
      * 3. getReward
      * 4. notifyRewardQuantiy
      * @notice update most of the stuff like
      * 1. total reward Per Token Stored
      * 2. lastTimeRewardApplicable
      * 3. earning of the user
      * 4. user Reward Per Token Paid
      */
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

     /**
      * @dev uses the opcodes extcodesize (Get size of an account’s code)
      * if the address is contract address it will return size of its code
      * if not the contract address return the zero
      * @param _address the account needed to be verified
      */
     modifier isContract(address _address) {
          if (!Utilis.isContract(_address)) {
               revert StakingWithChainlink__AddressNotValid(_address);
          }
          _;
     }

     /**
      * @notice verifies that the token already listed for staking or not
      * if it listed then revert
      * @param token address needed to be checked if listed
      */
     modifier isTokenAlreadyListed(IERC20 token) {
          if (address(s_tokenPriceFeed[token]) != address(0)) {
               revert StakingWithChainlink__TokenAlreadyListed(token);
          }
          _;
     }

     /**
      * @notice opposite of modifier isTokenAlreadyListed
      * verifies that the token listed for staking or not
      * if not listed then revert
      * @param token address needed to be checked if listed
      */
     modifier isTokenNotListed(IERC20 token) {
          if (address(s_tokenPriceFeed[token]) == address(0)) {
               revert StakingWithChainlink__TokenNotListed(token);
          }
          _;
     }

     /**
      * @dev checks that previous set duration for the reward is finished?
      * if not finished then the owner is not allowed to change the reward durations
      */
     modifier isDurationFinished() {
          if (s_finishAt > block.timestamp) {
               revert StakingWithChainlink__DurationNotFinished(
                    s_finishAt,
                    block.timestamp
               );
          }
          _;
     }

     //simple modifier that checks if passed value zero then revert
     modifier isQuantityZero(uint256 quantity) {
          if (quantity == 0) {
               revert StakingWithChainlink__GivenQuantityIsZero();
          }
          _;
     }

     /**
      * @dev we can use same isQuantityZero==isDurationZero to check zero
      * but revert/reply become ambiguous
      * if we add custom message, this cast more
      */
     modifier isDurationZero(uint256 duration) {
          if (duration == 0) {
               revert StakingWithChainlink__RewardDurationIsZero();
          }
          _;
     }

     /**
      * @dev before notifying the reward or setting the reward
      * check that balance always greater than
      * the quantity of the reward tokens
      */
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

     /**
      * @notice set the reward token address
      * @dev if want you can make the owner a DAO which is truely decentralized
      * and through DAO you can set every task in truely decentralized and algorthimic way
      */
     constructor(
          IERC20 rewardToken
     ) isContract(address(rewardToken)) Ownable(msg.sender) {
          s_rewardToken = rewardToken;
     }

     //<----------------------------external functions---------------------------->
     /**
      * @dev owner can set priceFeed address, and token address
      * @param token which can be staked
      * @param priceFeed chainlink oracle price feed of the token
      */
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

     /**
      * @dev user can pass the token address and quantity which is being staked token address must be listed for staking
      * @param token the address of the token listed
      * @param quantity number of token being staked
      */
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

     /**
      * @dev user can pass the token address and quantity which is being staked token address must be listed for staking
      * @param token the address of the token listed
      */
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

     /**
      * @dev allow user to get their reward
      */
     function getReward() external nonReentrant updateReward(msg.sender) {
          uint reward = s_rewards[msg.sender];
          if (reward > 0) {
               s_rewards[msg.sender] = 0;
               s_rewardToken.transfer(msg.sender, reward);
          }
     }

     /**
      * @dev allow owner to set reward durations
      * @param duration time period for which reward is being distributed
      */
     function setRewardsDuration(
          uint duration
     ) external onlyOwner isDurationFinished isDurationZero(duration) {
          s_duration = duration;
     }

     /**
      * @dev owner can set the amount of the reward that is being distrubuted
      * @notice only the owner can do this
      * @param quantity amount of token being distributed
      */
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
     /**
      * @return return the minimum of s_finishAt and block.timestamp
      */
     function lastTimeRewardApplicable() public view returns (uint) {
          return Utilis.min(s_finishAt, block.timestamp);
     }

     /**
      * @return the reward token based on time, total reward token and already staked tokens
      */
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

     /**
      * @return the reward token earning of the account which address is passed
      */
     function earned(address _account) public view returns (uint) {
          return
               ((s_stakerBalanceUSD[_account] *
                    (rewardPerToken() - s_userRewardPerTokenPaid[_account])) /
                    DECIMALS) + s_rewards[_account];
     }

     /**
      * @notice this function will return the USD amount/value of the any priceFeed
      * based on the quantity of the tokens
      * @param priceFeed address of the oracle pricefeed of which amount you want to get
      * @param quantity the amount of token to get their USD price
      * @return USD price of the token pass to the oracle chainlink
      * @dev revert if priceFeed address is not accurate
      */
     function getTotalStakedAmount(
          AggregatorV3Interface priceFeed,
          uint256 quantity
     ) public view isContract(address(priceFeed)) returns (uint256) {
          return ChainlinkManager.getTotalStakedAmount(priceFeed, quantity);
     }

     function getDecimals() external pure returns (uint256) {
          return DECIMALS;
     }

     function getRewardToken() external view returns (IERC20) {
          return s_rewardToken;
     }

     function getDuration() external view returns (uint256) {
          return s_duration;
     }

     function getFinishAt() external view returns (uint256) {
          return s_finishAt;
     }

     function getUpdatedAt() external view returns (uint256) {
          return s_updatedAt;
     }

     function getRewardRate() external view returns (uint256) {
          return s_rewardRate;
     }

     function getRewardPerTokenStored() external view returns (uint256) {
          return s_rewardPerTokenStored;
     }

     function getUserRewardPerTokenPaid(
          address user
     ) external view returns (uint256) {
          return s_userRewardPerTokenPaid[user];
     }

     function getRewards(address user) external view returns (uint256) {
          return s_rewards[user];
     }

     function getTotalAmountUSD() external view returns (uint256) {
          return s_totalAmountUSD;
     }

     function getTokenPriceFeed(
          IERC20 token
     ) external view returns (AggregatorV3Interface) {
          return s_tokenPriceFeed[token];
     }

     function getStakerTokenQuantity(
          IERC20 token,
          address staker
     ) external view returns (uint256) {
          return s_stakerTokenQuantity[token][staker];
     }

     function getStakerTokenAmountUSD(
          IERC20 token,
          address staker
     ) external view returns (uint256) {
          return s_stakerTokenAmountUSD[token][staker];
     }

     function getStakerBalanceUSD(
          address staker
     ) external view returns (uint256) {
          return s_stakerBalanceUSD[staker];
     }

     //<----------------------------private functions---------------------------->

     /**
      * @notice private function to break the function to avoid memory error
      * and to decrease the local variables in the function
      * @dev user can pass the token address and quantity which is being staked token address must be listed for staking
      * @param token the address of the token listed
      * @param quantity number of token being staked
      * @param amountUSD USD price value of the tokens being unstaked
      */
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

     /**
      * @notice private function to break the function to avoid memory error
      * and to decrease the local variables in the function
      * @dev user can pass the token address and quantity which is being staked token
      * address must be listed for staking
      * @param token the address of the token listed
      * @param quantity of the tokens being unstaked
      * @param amountUSD USD price value of the tokens being unstaked
      */
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
