const { network, ethers } = require("hardhat");
const {
  developmentChains,
  INITIAL_SUPPLY,
} = require("../../helper-hardhat-config");
const { assert, expect } = require("chai");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("OurToken Unit Tests", () => {
      async function deployOurTokenFixture() {
        const [deployer, recipient] = await ethers.getSigners();
        const contractFactory = await ethers.getContractFactory("OurToken");
        const ourToken = await contractFactory
          .connect(deployer)
          .deploy(INITIAL_SUPPLY);

        return { ourToken, deployer, recipient };
      }

      describe("deployment", () => {
        describe("success", () => {
          it("should deploy the contract", async () => {
            const { ourToken } = await loadFixture(deployOurTokenFixture);
            assert(ourToken.target);
          });
        });
      });

      describe("constructor", () => {
        it("should have correct initial supply of tokens", async () => {
          const { ourToken } = await loadFixture(deployOurTokenFixture);
          const totalSupply = await ourToken.totalSupply();
          assert.equal(totalSupply.toString(), INITIAL_SUPPLY);
        });

        it("should have correct name and symbol", async () => {
          const { ourToken } = await loadFixture(deployOurTokenFixture);
          const name = await ourToken.name();
          const symbol = await ourToken.symbol();
          assert.equal(name, "OurToken");
          assert.equal(symbol, "OT");
        });
      });

      describe("transfers", () => {
        const value = 50n;
        it("should be able to transfer tokens successfully to an address", async () => {
          const { ourToken, recipient } = await loadFixture(
            deployOurTokenFixture
          );
          const tokensToSend = ethers.parseEther("10");
          await ourToken.transfer(recipient.address, tokensToSend);
          const recipientBalance = await ourToken.balanceOf(recipient.address);
          assert.equal(recipientBalance.toString(), tokensToSend);
        });

        it("should emit a transfer event when a transfer occurs", async () => {
          const { ourToken, deployer, recipient } = await loadFixture(
            deployOurTokenFixture
          );
          await expect(ourToken.transfer(recipient, value))
            .to.emit(ourToken, "Transfer")
            .withArgs(deployer.address, recipient.address, value);
        });
      });

      describe("allowances", () => {
        const value = 50n;
        it("should approve other address to spend tokens on behalf of the deployer", async () => {
          const { ourToken, deployer, recipient } = await loadFixture(
            deployOurTokenFixture
          );
          const tokensToApprove = ethers.parseEther("100");
          await ourToken.approve(recipient, tokensToApprove);
          await ourToken
            .connect(recipient)
            .transferFrom(deployer, recipient, tokensToApprove);
          assert.equal(await ourToken.balanceOf(recipient), tokensToApprove);
        });

        it("doesn't allow an unapproved address to do transfer", async () => {
          const { ourToken, deployer, recipient } = await loadFixture(
            deployOurTokenFixture
          );
          await expect(
            ourToken.connect(recipient).transferFrom(deployer, recipient, value)
          ).to.be.revertedWithCustomError(
            ourToken,
            "ERC20InsufficientAllowance"
          );
        });

        it("should emit an approval event when approval occurs", async () => {
          const { ourToken, recipient } = await loadFixture(
            deployOurTokenFixture
          );
          await expect(ourToken.approve(recipient, 100)).to.emit(
            ourToken,
            "Approval"
          );
        });

        it("the allowance should be updated correctly", async () => {
          const { ourToken, deployer, recipient } = await loadFixture(
            deployOurTokenFixture
          );
          await ourToken.approve(recipient, value);
          const allowance = await ourToken.allowance(deployer, recipient);
          assert.equal(allowance, value);
        });

        it("should revert if the spender tries to spend more than the allowance", async () => {
          const { ourToken, deployer, recipient } = await loadFixture(
            deployOurTokenFixture
          );
          await ourToken.approve(recipient, value);
          await expect(
            ourToken
              .connect(recipient)
              .transferFrom(deployer, recipient, 2n * value)
          ).to.be.revertedWithCustomError(
            ourToken,
            "ERC20InsufficientAllowance"
          );
        });
      });
    });
