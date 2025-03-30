const { network, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
const { assert, expect, chai } = require("chai");

const productIds = [
  "jabfbaljbalba211",
  "udbhqouehoqoq",
  "dqobh3hudbabcal",
  "dbqoub38bdand",
  "bajbfvaoibfqpwnnz",
  "fabefbfancaknifdwen",
  "dfneofhqifnkdnkds",
  "abfnjefbuefakndfa",
  "fbafeobfqebflanfl",
];

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("MileStones", function () {
      let mileStones;
      let _platformWallet;
      let deployer;
      let accounts;
      let mockV3Aggregator;
      const sendValue = ethers.parseEther("0.002");
      const withdrawValue = ethers.parseEther("3");

      beforeEach(async () => {
        accounts = await ethers.getSigners();
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        const mileStonesDeployment = await deployments.get("MileStones");
        mileStones = await ethers.getContractAt(
          "MileStones",
          mileStonesDeployment.address
        );
        /*const mockV3AggregatorDeployment = await deployments.get(
          "MockV3Aggregator"
        );
        mockV3Aggregator = await ethers.getContractAt(
          "MockV3Aggregator",
          mockV3AggregatorDeployment.address
        );*/
      });

      describe("constructor", async function () {
        it("sets the _platformWallet correctly", async () => {
          const _platformWallet = await mileStones._platformWallet;
          assert.equal(_platformWallet, deployer.target);
        });
        /*it("sets the aggregator addresses correctly", async () => {
          const response = await mileStones.getPriceFeed({});
          const price = await mileStones.getMainNetBalance();
          const pricetag = await mileStones.getPrice();
          console.log("price tag:", pricetag);
          console.log("price of 1 dollar in eth:", price);
          console.log("sent price  in eth:", sendValue);
          assert.equal(response, mockV3Aggregator.target);
        });*/
      });

      describe("lock funds", async function () {
        it("fails if the user does not send money", async () => {
          await expect(mileStones.lockFunds(productIds[0])).to.be.reverted;
        });
        it("locks funds", async () => {
          const pricetag = await mileStones.getPrice();
          console.log("Price Tag:", pricetag);
          await mileStones.lockFunds(productIds[0], { value: pricetag });
          const response = await mileStones.getUserMilestoneDetails(
            productIds[0]
          );
          amount = (BigInt(pricetag) * BigInt(95)) / BigInt(100);
          assert.equal(response[2], amount);
        });
      });

      describe("complete milestones", function () {
        beforeEach(async () => {
          await mileStones.lockFunds(productIds[0], { value: sendValue });
        });
        it("reverts when user tries to lock in again", async function () {
          await expect(
            mileStones.lockFunds(productIds[0], { value: sendValue })
          ).to.be.reverted;
        });

        it("complete milestone for a single funder", async function () {
          const startingUserBalance = await mileStones.getUserMilestoneDetails(
            productIds[0]
          );
          await mileStones.completeMilestone(productIds[0]);
          const remainingAmountAfterMilestone =
            await mileStones.getUserMilestoneDetails(productIds[0]);
          const timestamp = await mileStones.getCurrentTimestamp();
          assert.equal(
            startingUserBalance[3] + BigInt(1),
            remainingAmountAfterMilestone[3]
          );
        });

        it("doesn't let another user complete a milestone", async function () {
          const accounts = await ethers.getSigners();
          const secondContract = await mileStones.connect(accounts[1]);

          await expect(
            secondContract.completeMilestone(productIds[0])
          ).to.be.revertedWith(
            "Only the creator wallet can perform this action"
          );
        });

        it("expect 5th milestone to fail", async function () {
          for (let i = 0; i < 5; i++) {
            await mileStones.completeMilestone(productIds[0]);
          }
          await expect(
            mileStones.completeMilestone(productIds[0])
          ).to.be.revertedWith("All milestones already completed");
        });

        it("calculate amount withdrawn after completion", async function () {
          for (let i = 0; i < 5; i++) {
            await mileStones.completeMilestone(productIds[0]);
          }
          const remainingAmountAfterMilestone =
            await mileStones.getUserMilestoneDetails(productIds[0]);
          assert.equal(
            remainingAmountAfterMilestone[2],
            remainingAmountAfterMilestone[4]
          );
          assert.equal(
            remainingAmountAfterMilestone[1],
            remainingAmountAfterMilestone[3]
          );
        });
      });

      describe("complete milestones for multiple users", function () {
        it("works for multiple participants", async function () {
          const accounts = await ethers.getSigners();

          for (let i = 3; i < 6; i++) {
            const mileStonesContract = await mileStones.connect(accounts[i]);
            await mileStonesContract.lockFunds(productIds[i], {
              value: sendValue,
            });
            for (let j = 0; j < 5; j++) {
              await mileStonesContract.completeMilestone(productIds[i]);
            }
            const remainingAmountAfterMilestone =
              await mileStones.getUserMilestoneDetails(productIds[i]);
            assert.equal(
              remainingAmountAfterMilestone[2],
              remainingAmountAfterMilestone[4]
            );
            assert.equal(
              remainingAmountAfterMilestone[1],
              remainingAmountAfterMilestone[3]
            );
          }
        });
      });

      describe("performUpkeep", function () {
        it("can only run if checkupkeep is true", async () => {
          await mileStones.lockFunds(productIds[0], { value: sendValue });
          await mileStones.completeMilestone(productIds[0]);
          const balanceBeforeUpkep = await mileStones.getOwnerBalance();
          await network.provider.send("evm_increaseTime", [3600 * 24 * 7 + 1]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const tx = await mileStones.performUpkeep("0x");
          const balanceAfterUpkep = await mileStones.getOwnerBalance();
          console.log(balanceBeforeUpkep, balanceAfterUpkep);
          assert(tx);
        });
        it("reverts if checkup is false", async () => {
          await expect(mileStones.performUpkeep("0x")).to.be.reverted;
        });
        /* it("reverts when upkeep is calculating", async () => {
          await mileStones.lockFunds(productIds[0], { value: sendValue });
          await mileStones.completeMilestone(productIds[0]);
          await network.provider.send("evm_increaseTime", [3600 * 24 * 7 + 1]);
          await network.provider.request({ method: "evm_mine", params: [] });
          await mileStones.performUpkeep("0x");
          await expect(
            mileStones.lockFunds(productIds[1], { value: sendValue })
          ).to.be.reverted;
        });*/
        it("owner withdraws funds", async () => {
          await mileStones.lockFunds(productIds[0], { value: sendValue });
          const balanceBeforeWithdrawl = await mileStones.getOwnerBalance();
          const balanceBeforeUpkep = await mileStones.getOwnerBalance();
          await network.provider.send("evm_increaseTime", [3600 * 24 * 7 + 1]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const tx_upkeep = await mileStones.performUpkeep("0x");
          const tx = await mileStones.ownersWithdrawl(1);
          const balanceAfterWithdrawl = await mileStones.getOwnerBalance();
          console.log(balanceBeforeWithdrawl, balanceAfterWithdrawl);
          assert(tx);
        });
      });
    });
