// yarn hardhat run scripts/call.js --network edu
const hre = require("hardhat");

async function main() {
  const CONTRACT_ADDRESS = "0x8C8D84fB7CE0B68b8f5525CcB10fe4a2387B9C06"; // Replace with your deployed contract address
  const NEW_PRICE =
    hre.ethers.parseUnits("20000000000000") / BigInt(100000000000000); // Adjust the new price as needed
  //hre.ethers.parseUnits("10000000000000") / BigInt(100000000000000) -> this equals to 0.1
  // ethers.parseEther("0.0000001")
  const [deployer] = await hre.ethers.getSigners();

  console.log(`Using deployer address: ${deployer.address}`);

  const CreatorEconomy = await hre.ethers.getContractAt(
    "CreatorEconomy",
    CONTRACT_ADDRESS
  );

  console.log("Changing milestone price...");
  const tx = await CreatorEconomy.connect(deployer).changeMileStonePrice(
    NEW_PRICE
  );
  await tx.wait();
  //const balance = await CreatorEconomy.connect(deployer).getBalance();
  //const price = await CreatorEconomy.connect(deployer).getPrice();

  console.log(`Milestone price changed successfully to: ${NEW_PRICE}`, tx);
  //console.log(`Creator Balance: ${balance}`);
  //console.log(`Creation price: ${price}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
