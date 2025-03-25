const { network } = require("hardhat");
const {
  networkConfig,
  developmentChains,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  console.log(deployer);

  let ethUsdPriceFeedAddress;
  /*  if (chainId == 31337) {
    const ethUsdAggregator = await deployments.get("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
  } */

  const mileStones = await deploy("MileStones", {
    from: deployer,
    args: [
      deployer,
      3600 * 24 * 3,
      /*ethUsdPriceFeedAddress, networkConfig[chainId]["entryFee"]*/ ethers.parseEther(
        "0.001"
      ) / BigInt(100000000000000),
    ],
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
    //gasLimit: 200000000,
  });
  log(`...........${mileStones.address}.............`);
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(mileStones.address, [
      deployer,
      3600 * 24 * 3,
      /* networkConfig[chainId]["entryFee"], */ ethers.parseEther("0.00001") /
        BigInt(100000000000000),
    ]);
  }
};
module.exports.tags = ["all", "milestones"];
