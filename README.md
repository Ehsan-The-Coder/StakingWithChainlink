# Staking With Chainlink

This project is a DeFi application that enables users to stake their tokens and earn rewards using Chainlink oracles. Users can stake any token listed on a decentralized exchange and verified by the Chainlink oracle network.

The Chainlink oracle network provides real-time price feeds, ensuring accurate reflection of the staked tokens' value in the system. This is crucial for maintaining the integrity of the staking process and ensuring fair distribution of rewards.

## Features

-    **ERC20 Token Staking:** Stake any ERC20 token listed on a decentralized exchange and verified by the Chainlink oracle network.
-    **Real-Time Price Feeds:** Receive real-time price feeds from the Chainlink oracle network, ensuring accurate valuation of staked tokens.
-    **Reward Distribution:** Earn rewards based on the value of the staked tokens.

## Technologies Used

-    [Chainlink](https://docs.chain.link/data-feeds/price-feeds/) - Provides real-time price feeds to smart contracts, enabling accurate valuation of staked tokens.
-    [Solidity](https://soliditylang.org/) - The programming language used to write smart contracts for the Ethereum blockchain.
-    [Hardhat](https://hardhat.org/) - A development environment for Ethereum that allows for compiling, testing, and deploying smart contracts. It includes advanced features like mainnet forking and account impersonation for comprehensive testing.
-    [OpenZeppelin](https://openzeppelin.com/) - Library for secure smart contract development
-    [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/) - Used for scripting and deployment tasks.

## Project Structure

-    **contracts:** Contains the smart contracts (`StakingWithChainlink.sol`, `RewardToken.sol`), library contracts (`ChainlinkManager.sol`, `Utilis.sol`), and test files for the smart contracts including `TestChainlink.sol`.
-    **deploy:** Contains deployment scripts for the smart contracts. Includes files such as `01-TestChainlink-deploy.js`, `02-RewardToken-deploy-.js`, and `03-StakingWithChainlink-deploy.js`.
-    **scripts:** Contains additional scripts for the project.
-    **utils:** Contains utility scripts for the project. Includes scripts such as `approveTokens.js`, `fundAllAccounts.js`, and `getTotalStakedAmount.js`.
-    **test:** Contains unit tests for the project. Includes files such as `01-StakingWithChainlink-unit-test.js` and `import-All.js`.

## Getting Started

To get started with this project, clone the repository and install the dependencies:

### Prerequisites

-    Node.js and npm or yarn
-    Hardhat
-    Ethereum wallet

### Installation

1. Clone the repository and navigate to the newly created folder:

     ```bash
     git clone https://github.com/Ehsan-The-Coder/StakingWithChainlink.git
     cd StakingWithChainlink
     ```

2. Install the dependencies:
     ```bash
      yarn
     ```
3. Compile the smart contracts:
     ```bash
      yarn hardhat compile
     ```
4. Deploy the contracts:
     ```bash
     yarn hardhat deploy
     ```

### Running the tests

To run the tests, use the following command:

```bash
yarn hardhat test
```

## License

This project is licensed under the MIT License.

## Acknowledgments

-    Chainlink
-    Ethereum Foundation
-    OpenZeppelin
-    https://github.com/PatrickAlphaC
