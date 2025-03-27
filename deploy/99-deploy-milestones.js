const fs = require("fs");
const { network, deployments, ethers, artifacts } = require("hardhat");

const FRONT_END_ADDRESSES =
  "/Users/Administrator/LLM-PDF-Chat/src/creators-constants/ContractAddresses.json";
const FRONT_END_ABI =
  "/Users/Administrator/LLM-PDF-Chat/src/creators-constants/abi.json";

module.exports = async () => {
  console.log("updating front end");
  await updateContractAddresses();
  await updateAbi();
};

async function updateContractAddresses() {
  const CreatorEconomyDeployment = await deployments.get("CreatorEconomy");
  const CreatorEconomy = await ethers.getContractAt(
    "CreatorEconomy",
    CreatorEconomyDeployment.address
  );

  const chainId = network.config.chainId.toString();
  const addresses = fs.readFileSync(FRONT_END_ADDRESSES, "utf8");
  console.log(addresses);
  const currentAddresses = JSON.parse(addresses);

  if (chainId in currentAddresses) {
    if (!currentAddresses[chainId].includes(CreatorEconomy.target)) {
      currentAddresses[chainId].push(CreatorEconomy.target);
    }
  } else {
    currentAddresses[chainId] = [CreatorEconomy.target];
  }

  fs.writeFileSync(FRONT_END_ADDRESSES, JSON.stringify(currentAddresses));
  console.log("done");
}

async function updateAbi() {
  const CreatorEconomyDeployment = await deployments.get("CreatorEconomy");
  const CreatorEconomy = await ethers.getContractAt(
    "CreatorEconomy",
    CreatorEconomyDeployment.address
  );

  const contractArtifact = await artifacts.readArtifact("CreatorEconomy");
  const abi = contractArtifact.abi;

  fs.writeFileSync(FRONT_END_ABI, JSON.stringify(abi));
  console.log("ABI updated successfully");
}

module.exports.tags = ["all", "frontend"];
