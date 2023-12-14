// test/ICOToken.test.js
const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("ICOToken", function () {
  let ICOToken;
  let icotoken;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    ICOToken = await ethers.getContractFactory("ICOToken");
    icotoken = await ICOToken.connect(owner).deploy("MyToken", "MT", ethers.utils.parseEther("1000000"));
  });

  it("Should have the correct name, symbol, and cap", async function () {
    expect(await icotoken.name()).to.equal("MyToken");
    expect(await icotoken.symbol()).to.equal("MT");
    expect(await icotoken.cap()).to.equal(ethers.utils.parseEther("1000000"));
  });

  it("Should allow the owner to mint new tokens", async function () {
    await icotoken.connect(owner).mint(addr1.address, ethers.utils.parseEther("1000"));
    expect(await icotoken.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("1000"));
  });

  it("Should not allow non-owners to mint tokens", async function () {
    await expect(icotoken.connect(addr1).mint(addr2.address, ethers.utils.parseEther("1000"))).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });

  it("Should allow anyone to burn their own tokens", async function () {
    await icotoken.connect(owner).mint(addr1.address, ethers.utils.parseEther("1000"));
    await icotoken.connect(addr1).burn(addr1.address, ethers.utils.parseEther("500"));
    expect(await icotoken.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("500"));
  });

  it("Should not allow burning more tokens than the balance", async function () {
    await icotoken.connect(owner).mint(addr1.address, ethers.utils.parseEther("1000"));
    await expect(icotoken.connect(addr1).burn(addr1.address, ethers.utils.parseEther("1500"))).to.be.revertedWith(
      "ERC20: burn amount exceeds balance"
    );
  });
});
