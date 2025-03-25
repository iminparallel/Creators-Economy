const fs = require("fs");
const { network, deployments, ethers, artifacts } = require("hardhat");
const FRONT_END_ADDRESSES =
  "/Users/Administrator/LLM-PDF-Chat/src/constants2/ContractAddresses.json";
const FRONT_END_ABI =
  "/Users/Administrator/LLM-PDF-Chat/src/constants2/abi.json";
const FRONT_END_ABI2 =
  "/Users/haritchowdhury/ainiversity-beta/LLM-PDF-Chat/src/constants/abi2.json";

module.exports = async () => {
  console.log("updating front end");
  updateContractAddresses();
  updateAbi();
};

async function updateContractAddresses() {
  let mileStones;
  const mileStonesDeployment = await deployments.get("MileStones");
  mileStones = await ethers.getContractAt(
    "MileStones",
    mileStonesDeployment.address
  );
  const chainId = network.config.chainId.toString();
  const addresses = fs.readFileSync(FRONT_END_ADDRESSES, "utf8");
  console.log(addresses);
  const currentAddresses = JSON.parse(addresses);
  if (chainId in currentAddresses) {
    if (!currentAddresses[chainId].includes(mileStones.target)) {
      currentAddresses[chainId].push(mileStones.target);
    }
  } else {
    currentAddresses[chainId] = [mileStones.target];
  }
  fs.writeFileSync(FRONT_END_ADDRESSES, JSON.stringify(currentAddresses));
  console.log("done");
}
async function updateAbi() {
  let mileStones;
  const mileStonesDeployment = await deployments.get("MileStones");
  mileStones = await ethers.getContractAt(
    "MileStones",
    mileStonesDeployment.address
  );
  console.log(JSON.stringify(mileStones.interface.format("json")));
  const contractArtifact = await artifacts.readArtifact("MileStones"); // Replace with your contract name
  const abi = contractArtifact.abi;
  fs.writeFileSync(FRONT_END_ABI, JSON.stringify(abi));
}
async function updateAbi2() {
  let mileStones;
  const mileStonesDeployment = await deployments.get("MileStones");
  mileStones = await ethers.getContractAt(
    "MileStones",
    mileStonesDeployment.address
  );
  fs.writeFileSync(
    FRONT_END_ABI,
    JSON.stringify(mileStones.interface.format("json"))
  );
}
module.exports.tags = ["all", "frontend"];
