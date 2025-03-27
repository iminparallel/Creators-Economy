require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");
require("hardhat-deploy");
require("dotenv").config();

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const EDU_RPC_URL = process.env.EDU_RPC_URL || "";
const EDU_PRIVATE_KEY = process.env.EDU_PRIVATE_KEY || "";
const ALCHEMY_KEY = process.env.ALCHEMY_KEY || "";
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      { version: "0.8.0" },
      { version: "0.8.28" },
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          evmVersion: "paris",
        },
      },
      //{ version: "0.6.0" },
    ],
  },
  paths: {
    sources: "./contracts",
  },
  namedAccounts: {
    deployer: {
      default: 0,
      1: 0,
    },
  },

  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      accounts: [EDU_PRIVATE_KEY],
      chainId: 11155111,
      blockConfirmations: 6,
    },
    edu: {
      url: "https://rpc.open-campus-codex.gelato.digital",
      accounts: [EDU_PRIVATE_KEY],
      chainId: 656476,
      blockConfirmations: 6,
    },
    localhost: {
      url: "http://localhost:8545",
      chainId: 31337,
    },
  },
  /*
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  }, */
  etherscan: {
    apiKey: {
      edu: ETHERSCAN_API_KEY,
      sepolia: ETHERSCAN_API_KEY,
    },
    customChains: [
      {
        network: "edu",
        chainId: 656476,
        urls: {
          apiURL: "https://edu-chain-testnet.blockscout.com/api",
          browserURL: "https://edu-chain-testnet.blockscout.com",
        },
      },
    ],
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
  },
  mocha: {
    timeout: 500000,
  },
};
