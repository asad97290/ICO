require("@nomicfoundation/hardhat-toolbox");

require("dotenv").config()
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    // LOCAL
    hardhat: { chainId: 31337 },
   
    // ARBITRUM
    "arbitrum-mainnet": {
      accounts: [process.env.PK],
      chainId: 42161,
      url: "https://arb1.arbitrum.io/rpc",
    } ,
    "arbitrum-sepolia":  {
      accounts: [process.env.PK],
      chainId: 421614,
      url: "https://sepolia-rollup.arbitrum.io/rpc",
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: {
      "arbitrum-sepolia":process.env.ETHERSCAN_API
    }
  },
  customChains: [
    {
      network: "arbitrum-sepolia",
      chainId: 421614,
      urls: {
        apiURL: "https://sepolia.arbiscan.io/api",
        browserURL: "https://sepolia.arbiscan.io"
      }
    }
  ],
  sourcify: {
    enabled: true
  },
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
        
          // Disable the optimizer when debugging
          // https://hardhat.org/hardhat-network/#solidity-optimizer-support
          optimizer: {
            enabled: true,
            runs: 200,
          },
          evmVersion: "paris",
        },
      },
    ],
  },
};

