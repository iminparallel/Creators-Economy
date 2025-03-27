const { network, ethers } = require("hardhat");
const {
  networkConfig,
  developmentChains,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  console.log(`Deploying with account: ${deployer}`);

  const platformWallet = deployer; // Using deployer as platform wallet
  const interval = 3600 * 24 * 3; // 3 days in seconds
  const initialPrice = ethers.parseEther("0.00001"); // Initial milestone price

  const CreatorEconomy = await deploy("CreatorEconomy", {
    from: deployer,
    args: [
      platformWallet, // Platform wallet address
      interval, // Interval for upkeep
      initialPrice, // Initial milestone price
    ],
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  log(`CreatorEconomy deployed at: ${CreatorEconomy.address}`);

  // Verify on etherscan if not on a development chain
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(CreatorEconomy.address, [
      platformWallet,
      interval,
      initialPrice,
    ]);
  }
};

module.exports.tags = ["all", "CreatorEconomy"];
